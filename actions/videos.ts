"use server"

import { prisma } from "@/lib/db"
import { getChannelVideos, getVideoInfo, type VideoInfo, type VideosResult } from "@/lib/youtube"

export type { VideoInfo }

export async function getVideos(filterChannelIds?: string[]): Promise<VideosResult> {
  const subscriptions = await prisma.subscription.findMany()
  let channelIds = subscriptions.map(s => s.channelId)

  if (filterChannelIds && filterChannelIds.length > 0) {
    channelIds = channelIds.filter(id => filterChannelIds.includes(id))
  }

  if (channelIds.length === 0) return { videos: [], pageTokens: {} }

  return getChannelVideos(channelIds)
}

export async function loadMoreVideos(
  pageTokens: Record<string, string | null>,
  filterChannelIds?: string[]
): Promise<VideosResult> {
  const subscriptions = await prisma.subscription.findMany()
  let channelIds = subscriptions.map(s => s.channelId)

  if (filterChannelIds && filterChannelIds.length > 0) {
    channelIds = channelIds.filter(id => filterChannelIds.includes(id))
  }

  if (channelIds.length === 0) return { videos: [], pageTokens: {} }

  return getChannelVideos(channelIds, pageTokens)
}

export async function getVideosByChannel(channelId: string): Promise<VideosResult> {
  return getChannelVideos([channelId])
}

export async function getVideo(videoId: string): Promise<VideoInfo | null> {
  return getVideoInfo(videoId)
}
