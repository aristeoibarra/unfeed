"use server"

import { prisma } from "@/lib/db"
import { getChannelVideos, getVideoInfo, type VideoInfo, type VideosResult } from "@/lib/youtube"

export type { VideoInfo }

export async function getVideos(filterChannelId?: string): Promise<VideosResult> {
  const channels = await prisma.channel.findMany()
  let channelIds = channels.map(c => c.channelId)

  if (filterChannelId) {
    channelIds = channelIds.filter(id => id === filterChannelId)
  }

  if (channelIds.length === 0) return { videos: [], pageTokens: {} }

  return getChannelVideos(channelIds)
}

export async function loadMoreVideos(
  pageTokens: Record<string, string | null>,
  filterChannelId?: string
): Promise<VideosResult> {
  const channels = await prisma.channel.findMany()
  let channelIds = channels.map(c => c.channelId)

  if (filterChannelId) {
    channelIds = channelIds.filter(id => id === filterChannelId)
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
