import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getChannelVideos } from "@/lib/youtube"
import { revalidatePath } from "next/cache"
import { getSyncIntervalHours } from "@/actions/settings"

const CRON_SECRET = process.env.CRON_SECRET

interface SyncError {
  channelId: string
  channelName: string
  error: string
}

interface SyncResult {
  success: boolean
  timestamp: string
  channelsSynced: number
  newVideos: number
  newNotifications: number
  totalVideosInCache: number
  apiUnitsUsed: number
  cleanedNotifications: number
  errors: SyncError[]
  skipped?: boolean
  skipReason?: string
}

export async function GET(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    )
  }

  if (token !== CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const startTime = Date.now()

  try {
    // Get sync interval from settings
    const syncIntervalHours = await getSyncIntervalHours()

    // Check for recent sync - skip if manual sync was done recently
    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { createdAt: "desc" }
    })

    if (lastSync) {
      const hoursSince = (Date.now() - lastSync.createdAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince < syncIntervalHours) {
        const totalVideos = await prisma.video.count()
        const skipReason = `Recent sync exists (${hoursSince.toFixed(1)}h ago, type: ${lastSync.type})`

        // Log the skipped sync
        await prisma.syncLog.create({
          data: {
            type: "auto",
            status: "skipped",
            channelsSynced: 0,
            newVideos: 0,
            apiUnitsUsed: 0,
            duration: 0,
            triggeredBy: "cron"
          }
        })

        return NextResponse.json<SyncResult>({
          success: true,
          timestamp: new Date().toISOString(),
          channelsSynced: 0,
          newVideos: 0,
          newNotifications: 0,
          totalVideosInCache: totalVideos,
          apiUnitsUsed: 0,
          cleanedNotifications: 0,
          errors: [],
          skipped: true,
          skipReason
        })
      }
    }

    // Obtener canales activos que no tengan error y tengan sync habilitado
    const subscriptions = await prisma.subscription.findMany({
      where: { deletedAt: null, syncEnabled: true },
      include: { syncStatus: true }
    })

    const channelsToSync = subscriptions.filter(
      s => !s.syncStatus || s.syncStatus.status !== "error"
    )

    if (channelsToSync.length === 0) {
      const totalVideos = await prisma.video.count()
      const duration = Math.round((Date.now() - startTime) / 1000)

      // Log empty sync
      await prisma.syncLog.create({
        data: {
          type: "auto",
          status: "success",
          channelsSynced: 0,
          newVideos: 0,
          apiUnitsUsed: 0,
          duration,
          triggeredBy: "cron"
        }
      })

      return NextResponse.json<SyncResult>({
        success: true,
        timestamp: new Date().toISOString(),
        channelsSynced: 0,
        newVideos: 0,
        newNotifications: 0,
        totalVideosInCache: totalVideos,
        apiUnitsUsed: 0,
        cleanedNotifications: 0,
        errors: []
      })
    }

    const errors: SyncError[] = []
    let totalNewVideos = 0
    let totalNewNotifications = 0
    let channelsSynced = 0
    let apiUnitsUsed = 0

    // Sincronizar cada canal individualmente para mejor manejo de errores
    for (const subscription of channelsToSync) {
      try {
        // Marcar como syncing
        await prisma.syncStatus.upsert({
          where: { channelId: subscription.channelId },
          update: { status: "syncing" },
          create: { channelId: subscription.channelId, status: "syncing" }
        })

        // Obtener videos (50 por canal = 100 unidades de search + ~1 unidad de videos.list)
        const result = await getChannelVideos([subscription.channelId], undefined, {
          maxResults: 50,
          pages: 1
        })

        apiUnitsUsed += 101 // search (100) + videos.list (~1)

        // Detectar cambios de nombre/thumbnail del canal
        if (result.videos.length > 0) {
          const firstVideo = result.videos[0]
          if (firstVideo.channelName !== subscription.name) {
            // Actualizar nombre del canal en todas las tablas
            await prisma.subscription.update({
              where: { channelId: subscription.channelId },
              data: { name: firstVideo.channelName }
            })
            await prisma.video.updateMany({
              where: { channelId: subscription.channelId },
              data: { channelName: firstVideo.channelName }
            })
          }
        }

        // Insertar/actualizar videos
        let newVideosForChannel = 0
        for (const video of result.videos) {
          const existing = await prisma.video.findUnique({
            where: { videoId: video.videoId }
          })

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

          // Si es video nuevo, crear notificación
          if (!existing) {
            newVideosForChannel++

            await prisma.notification.create({
              data: {
                videoId: video.videoId,
                title: video.title,
                thumbnail: video.thumbnail,
                channelId: video.channelId,
                channelName: video.channelName,
                duration: video.duration
              }
            })
            totalNewNotifications++
          }
        }

        totalNewVideos += newVideosForChannel

        // Actualizar SyncStatus
        const videoCount = await prisma.video.count({
          where: { channelId: subscription.channelId }
        })

        await prisma.syncStatus.update({
          where: { channelId: subscription.channelId },
          data: {
            lastSyncedAt: new Date(),
            status: "ok",
            videoCount,
            errorMessage: null
          }
        })

        channelsSynced++
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        errors.push({
          channelId: subscription.channelId,
          channelName: subscription.name,
          error: message
        })

        // Marcar canal con error
        await prisma.syncStatus.upsert({
          where: { channelId: subscription.channelId },
          update: { status: "error", errorMessage: message },
          create: {
            channelId: subscription.channelId,
            status: "error",
            errorMessage: message
          }
        })
      }
    }

    // Limpiar notificaciones antiguas (> 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const cleanedResult = await prisma.notification.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    })

    // Revalidar cache
    revalidatePath("/")
    revalidatePath("/notifications")

    const totalVideosInCache = await prisma.video.count()
    const duration = Math.round((Date.now() - startTime) / 1000)

    // Log the sync result
    const syncStatus = errors.length === 0
      ? "success"
      : errors.length < channelsSynced
        ? "partial"
        : "error"

    await prisma.syncLog.create({
      data: {
        type: "auto",
        status: syncStatus,
        channelsSynced,
        newVideos: totalNewVideos,
        apiUnitsUsed,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        duration,
        triggeredBy: "cron"
      }
    })

    return NextResponse.json<SyncResult>({
      success: true,
      timestamp: new Date().toISOString(),
      channelsSynced,
      newVideos: totalNewVideos,
      newNotifications: totalNewNotifications,
      totalVideosInCache,
      apiUnitsUsed,
      cleanedNotifications: cleanedResult.count,
      errors
    })
  } catch (error) {
    console.error("Cron sync error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const duration = Math.round((Date.now() - startTime) / 1000)

    // Log the error
    await prisma.syncLog.create({
      data: {
        type: "auto",
        status: "error",
        channelsSynced: 0,
        newVideos: 0,
        apiUnitsUsed: 0,
        errors: JSON.stringify([{ error: message }]),
        duration,
        triggeredBy: "cron"
      }
    })

    return NextResponse.json(
      { error: `Sync failed: ${message}` },
      { status: 500 }
    )
  }
}
