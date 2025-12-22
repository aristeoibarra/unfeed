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

export async function getVideos(filterChannelIds?: string[], page: number = 1): Promise<CachedVideosResult> {
  const subscriptions = await prisma.subscription.findMany()
  let channelIds = subscriptions.map(s => s.channelId)

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

  const formattedVideos: VideoInfo[] = videos.map(v => ({
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    channelId: v.channelId,
    channelName: v.channelName,
    publishedAt: v.publishedAt.toISOString()
  }))

  return {
    videos: formattedVideos,
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

  const formattedVideos: VideoInfo[] = videos.map(v => ({
    videoId: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail,
    channelId: v.channelId,
    channelName: v.channelName,
    publishedAt: v.publishedAt.toISOString()
  }))

  return {
    videos: formattedVideos,
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
    return {
      videoId: cached.videoId,
      title: cached.title,
      thumbnail: cached.thumbnail,
      channelId: cached.channelId,
      channelName: cached.channelName,
      publishedAt: cached.publishedAt.toISOString()
    }
  }

  // Fallback to YouTube API if not in cache
  return getYouTubeVideoInfo(videoId)
}
