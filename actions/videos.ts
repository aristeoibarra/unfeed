"use server"

import { prisma } from "@/lib/db"
import { getVideoInfo as getYouTubeVideoInfo, type VideoInfo } from "@/lib/youtube"

export type { VideoInfo }

const VIDEOS_PER_PAGE = 24

export type SortOption = "newest" | "oldest" | "most_likes" | "longest" | "shortest"

export interface VideoFilters {
  channelIds?: string[]
  sort?: SortOption
  unwatchedOnly?: boolean
  search?: string
}

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

function getSortOrder(sort?: SortOption): { orderBy: Record<string, "asc" | "desc"> } {
  switch (sort) {
    case "oldest":
      return { orderBy: { publishedAt: "asc" } }
    case "most_likes":
      return { orderBy: { likeCount: "desc" } }
    case "longest":
      return { orderBy: { duration: "desc" } }
    case "shortest":
      return { orderBy: { duration: "asc" } }
    case "newest":
    default:
      return { orderBy: { publishedAt: "desc" } }
  }
}

export async function getVideos(
  filters: VideoFilters = {},
  page: number = 1,
  watchedVideoIds?: string[]
): Promise<CachedVideosResult> {
  const { channelIds: filterChannelIds, sort, unwatchedOnly, search } = filters

  // Solo canales activos (no eliminados)
  let channelIds = await getActiveChannelIds()

  if (filterChannelIds && filterChannelIds.length > 0) {
    channelIds = channelIds.filter(id => filterChannelIds.includes(id))
  }

  if (channelIds.length === 0) {
    return { videos: [], hasMore: false, total: 0 }
  }

  const skip = (page - 1) * VIDEOS_PER_PAGE
  const { orderBy } = getSortOrder(sort)

  // Build where clause
  const where: Record<string, unknown> = {
    channelId: { in: channelIds }
  }

  // Add search filter (SQLite LIKE is case-insensitive by default for ASCII)
  if (search && search.trim().length > 0) {
    where.OR = [
      { title: { contains: search } },
      { channelName: { contains: search } }
    ]
  }

  // Add unwatched filter
  if (unwatchedOnly && watchedVideoIds && watchedVideoIds.length > 0) {
    where.videoId = { notIn: watchedVideoIds }
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy,
      skip,
      take: VIDEOS_PER_PAGE
    }),
    prisma.video.count({ where })
  ])

  return {
    videos: videos.map(formatVideo),
    hasMore: skip + videos.length < total,
    total
  }
}

export async function loadMoreVideos(
  filters: VideoFilters = {},
  page: number = 2,
  watchedVideoIds?: string[]
): Promise<CachedVideosResult> {
  return getVideos(filters, page, watchedVideoIds)
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
