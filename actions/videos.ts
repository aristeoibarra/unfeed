"use server"

import { prisma } from "@/lib/db"
import { getVideoInfo as getYouTubeVideoInfo, type VideoInfo } from "@/lib/youtube"

export type { VideoInfo }

const VIDEOS_PER_PAGE = 24

export interface CachedVideosResult {
  videos: VideoInfo[]
  hasMore: boolean
  total: number
}

// Helper para obtener IDs de canales activos
async function getActiveChannelIds(): Promise<string[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { deletedAt: null },
    select: { channelId: true }
  })
  return subscriptions.map(s => s.channelId)
}

// Helper para formatear video de DB a VideoInfo
function formatVideo(v: {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  publishedAt: Date
  duration: number | null
  description: string | null
  tags: string | null
  category: string | null
  viewCount: number | null
  likeCount: number | null
}): VideoInfo {
  return {
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    channelId: v.channelId,
    channelName: v.channelName,
    publishedAt: v.publishedAt.toISOString(),
    duration: v.duration,
    description: v.description,
    tags: v.tags,
    category: v.category,
    viewCount: v.viewCount,
    likeCount: v.likeCount
  }
}

export async function getVideos(filterChannelIds?: string[], page: number = 1): Promise<CachedVideosResult> {
  // Solo canales activos (no eliminados)
  let channelIds = await getActiveChannelIds()

  if (filterChannelIds && filterChannelIds.length > 0) {
    channelIds = channelIds.filter(id => filterChannelIds.includes(id))
  }

  if (channelIds.length === 0) {
    return { videos: [], hasMore: false, total: 0 }
  }

  const skip = (page - 1) * VIDEOS_PER_PAGE

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: {
        channelId: { in: channelIds }
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: VIDEOS_PER_PAGE
    }),
    prisma.video.count({
      where: {
        channelId: { in: channelIds }
      }
    })
  ])

  return {
    videos: videos.map(formatVideo),
    hasMore: skip + videos.length < total,
    total
  }
}

export async function loadMoreVideos(
  filterChannelIds?: string[],
  page: number = 2
): Promise<CachedVideosResult> {
  return getVideos(filterChannelIds, page)
}

export async function getVideosByChannel(channelId: string, page: number = 1): Promise<CachedVideosResult> {
  const skip = (page - 1) * VIDEOS_PER_PAGE

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { channelId },
      orderBy: { publishedAt: "desc" },
      skip,
      take: VIDEOS_PER_PAGE
    }),
    prisma.video.count({
      where: { channelId }
    })
  ])

  return {
    videos: videos.map(formatVideo),
    hasMore: skip + videos.length < total,
    total
  }
}

export async function getVideo(videoId: string): Promise<VideoInfo | null> {
  // First try to get from cache
  const cached = await prisma.video.findUnique({
    where: { videoId }
  })

  if (cached) {
    return formatVideo(cached)
  }

  // Fallback to YouTube API if not in cache
  return getYouTubeVideoInfo(videoId)
}
