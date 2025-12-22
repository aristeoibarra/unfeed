"use server"

import { prisma } from "@/lib/db"
import { getChannelVideos } from "@/lib/youtube"
import { revalidatePath } from "next/cache"

const SYNC_COOLDOWN_HOURS = 6

export async function getSyncStatus() {
  const subscriptions = await prisma.subscription.findMany()
  const syncStatuses = await prisma.syncStatus.findMany()

  const statusMap = new Map(syncStatuses.map(s => [s.channelId, s.lastSyncedAt]))

  const now = new Date()
  let needsSync = false
  let lastSyncedAt: Date | null = null

  for (const sub of subscriptions) {
    const lastSync = statusMap.get(sub.channelId)
    if (!lastSync) {
      needsSync = true
    } else {
      const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync >= SYNC_COOLDOWN_HOURS) {
        needsSync = true
      }
      if (!lastSyncedAt || lastSync < lastSyncedAt) {
        lastSyncedAt = lastSync
      }
    }
  }

  const cachedVideoCount = await prisma.video.count()

  return {
    needsSync,
    lastSyncedAt,
    cachedVideoCount,
    subscriptionCount: subscriptions.length
  }
}

export async function syncVideos(): Promise<{ success: boolean; message: string; syncedCount: number }> {
  try {
    const subscriptions = await prisma.subscription.findMany()

    if (subscriptions.length === 0) {
      return { success: true, message: "No subscriptions to sync", syncedCount: 0 }
    }

    const channelIds = subscriptions.map(s => s.channelId)

    // Fetch videos from YouTube API
    const result = await getChannelVideos(channelIds)

    if (result.videos.length === 0) {
      return { success: true, message: "No new videos found", syncedCount: 0 }
    }

    // Upsert videos into database
    let syncedCount = 0
    for (const video of result.videos) {
      await prisma.video.upsert({
        where: { videoId: video.videoId },
        update: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          cachedAt: new Date()
        },
        create: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: new Date(video.publishedAt)
        }
      })
      syncedCount++
    }

    // Update sync status for each channel
    const now = new Date()
    for (const channelId of channelIds) {
      await prisma.syncStatus.upsert({
        where: { channelId },
        update: { lastSyncedAt: now },
        create: { channelId, lastSyncedAt: now }
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
    const result = await getChannelVideos([channelId])

    for (const video of result.videos) {
      await prisma.video.upsert({
        where: { videoId: video.videoId },
        update: {
          title: video.title,
          thumbnail: video.thumbnail,
          channelName: video.channelName,
          cachedAt: new Date()
        },
        create: {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          publishedAt: new Date(video.publishedAt)
        }
      })
    }

    await prisma.syncStatus.upsert({
      where: { channelId },
      update: { lastSyncedAt: new Date() },
      create: { channelId, lastSyncedAt: new Date() }
    })

    revalidatePath("/")
    revalidatePath(`/subscription/${channelId}`)

    return { success: true, message: `Synced ${result.videos.length} videos` }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, message }
  }
}
