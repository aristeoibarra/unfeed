"use server"

import { prisma } from "@/lib/db"
import { getChannelVideos } from "@/lib/youtube"
import { revalidatePath } from "next/cache"

const SYNC_COOLDOWN_HOURS = 6

export async function getSyncStatus() {
  // Solo canales activos (no eliminados)
  const subscriptions = await prisma.subscription.findMany({
    where: { deletedAt: null }
  })
  const syncStatuses = await prisma.syncStatus.findMany()

  const statusMap = new Map(syncStatuses.map(s => [s.channelId, s]))

  const now = new Date()
  let needsSync = false
  let lastSyncedAt: Date | null = null
  let channelsWithErrors = 0

  for (const sub of subscriptions) {
    const syncStatus = statusMap.get(sub.channelId)
    if (!syncStatus) {
      needsSync = true
    } else {
      // Skip canales con error
      if (syncStatus.status === "error") {
        channelsWithErrors++
        continue
      }

      const hoursSinceSync = (now.getTime() - syncStatus.lastSyncedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync >= SYNC_COOLDOWN_HOURS) {
        needsSync = true
      }
      if (!lastSyncedAt || syncStatus.lastSyncedAt < lastSyncedAt) {
        lastSyncedAt = syncStatus.lastSyncedAt
      }
    }
  }

  const cachedVideoCount = await prisma.video.count()

  return {
    needsSync,
    lastSyncedAt,
    cachedVideoCount,
    subscriptionCount: subscriptions.length,
    channelsWithErrors
  }
}

export async function syncVideos(): Promise<{ success: boolean; message: string; syncedCount: number }> {
  try {
    // Solo canales activos (no eliminados) y sin status de error
    const subscriptions = await prisma.subscription.findMany({
      where: { deletedAt: null },
      include: { syncStatus: true }
    })

    // Filtrar canales que no tienen error
    const activeSubscriptions = subscriptions.filter(
      s => !s.syncStatus || s.syncStatus.status !== "error"
    )

    if (activeSubscriptions.length === 0) {
      return { success: true, message: "No subscriptions to sync", syncedCount: 0 }
    }

    const channelIds = activeSubscriptions.map(s => s.channelId)

    // Marcar como "syncing"
    for (const channelId of channelIds) {
      await prisma.syncStatus.upsert({
        where: { channelId },
        update: { status: "syncing" },
        create: { channelId, status: "syncing" }
      })
    }

    // Fetch videos from YouTube API (50 videos por canal)
    const result = await getChannelVideos(channelIds, undefined, { maxResults: 50 })

    if (result.videos.length === 0) {
      // Marcar como "ok" aunque no haya videos nuevos
      for (const channelId of channelIds) {
        await prisma.syncStatus.update({
          where: { channelId },
          data: { status: "ok", lastSyncedAt: new Date() }
        })
      }
      return { success: true, message: "No new videos found", syncedCount: 0 }
    }

    // Upsert videos into database con campos expandidos
    let syncedCount = 0
    for (const video of result.videos) {
      await prisma.video.upsert({
        where: { videoId: video.videoId },
        update: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          cachedAt: new Date()
        },
        create: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: new Date(video.publishedAt),
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount
        }
      })
      syncedCount++
    }

    // Update sync status for each channel
    const now = new Date()
    for (const channelId of channelIds) {
      const videoCount = await prisma.video.count({ where: { channelId } })
      await prisma.syncStatus.upsert({
        where: { channelId },
        update: {
          lastSyncedAt: now,
          status: "ok",
          videoCount,
          errorMessage: null
        },
        create: {
          channelId,
          lastSyncedAt: now,
          status: "ok",
          videoCount
        }
      })
    }

    revalidatePath("/")

    return {
      success: true,
      message: `Synced ${syncedCount} videos successfully`,
      syncedCount
    }
  } catch (error) {
    console.error("Sync error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"

    if (message.includes("quota")) {
      return {
        success: false,
        message: "YouTube API quota exceeded. Try again tomorrow.",
        syncedCount: 0
      }
    }

    return { success: false, message: `Sync failed: ${message}`, syncedCount: 0 }
  }
}

export async function syncSingleChannel(channelId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Marcar como syncing
    await prisma.syncStatus.upsert({
      where: { channelId },
      update: { status: "syncing" },
      create: { channelId, status: "syncing" }
    })

    const result = await getChannelVideos([channelId], undefined, { maxResults: 50 })

    for (const video of result.videos) {
      await prisma.video.upsert({
        where: { videoId: video.videoId },
        update: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          cachedAt: new Date()
        },
        create: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: new Date(video.publishedAt),
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount
        }
      })
    }

    const videoCount = await prisma.video.count({ where: { channelId } })
    await prisma.syncStatus.upsert({
      where: { channelId },
      update: {
        lastSyncedAt: new Date(),
        status: "ok",
        videoCount,
        errorMessage: null
      },
      create: {
        channelId,
        lastSyncedAt: new Date(),
        status: "ok",
        videoCount
      }
    })

    revalidatePath("/")
    revalidatePath(`/subscription/${channelId}`)

    return { success: true, message: `Synced ${result.videos.length} videos` }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    // Marcar canal con error
    await prisma.syncStatus.upsert({
      where: { channelId },
      update: { status: "error", errorMessage: message },
      create: { channelId, status: "error", errorMessage: message }
    })

    return { success: false, message }
  }
}

// Deep Sync: Para canales nuevos - obtiene 250 videos (5 páginas × 50)
// Costo: ~500 unidades de API por canal
export async function deepSync(channelId: string): Promise<{ success: boolean; message: string; videoCount: number }> {
  try {
    // Marcar como syncing
    await prisma.syncStatus.upsert({
      where: { channelId },
      update: { status: "syncing" },
      create: { channelId, status: "syncing" }
    })

    // Obtener 5 páginas de 50 videos = 250 videos
    const result = await getChannelVideos([channelId], undefined, {
      maxResults: 50,
      pages: 5
    })

    let syncedCount = 0
    for (const video of result.videos) {
      await prisma.video.upsert({
        where: { videoId: video.videoId },
        update: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          cachedAt: new Date()
        },
        create: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: new Date(video.publishedAt),
          duration: video.duration,
          description: video.description,
          tags: video.tags,
          category: video.category,
          viewCount: video.viewCount,
          likeCount: video.likeCount
        }
      })
      syncedCount++
    }

    const videoCount = await prisma.video.count({ where: { channelId } })
    await prisma.syncStatus.update({
      where: { channelId },
      data: {
        lastSyncedAt: new Date(),
        status: "ok",
        videoCount,
        errorMessage: null
      }
    })

    revalidatePath("/")

    return {
      success: true,
      message: `Deep sync completed: ${syncedCount} videos`,
      videoCount: syncedCount
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    await prisma.syncStatus.upsert({
      where: { channelId },
      update: { status: "error", errorMessage: message },
      create: { channelId, status: "error", errorMessage: message }
    })

    return { success: false, message, videoCount: 0 }
  }
}
