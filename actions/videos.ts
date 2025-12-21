"use server"

import { prisma } from "@/lib/db"
import { getChannelVideos, getVideoInfo, type VideoInfo } from "@/lib/youtube"
import { unstable_cache } from "next/cache"

// Cache videos for 1 hour to avoid hitting API rate limits
const getCachedVideos = unstable_cache(
  async (channelIds: string[]): Promise<VideoInfo[]> => {
    return getChannelVideos(channelIds)
  },
  ["channel-videos"],
  { revalidate: 3600 } // 1 hour
)

export async function getVideos(): Promise<VideoInfo[]> {
  const channels = await prisma.channel.findMany()
  const channelIds = channels.map(c => c.channelId)

  if (channelIds.length === 0) return []

  return getCachedVideos(channelIds)
}

export async function getVideo(videoId: string): Promise<VideoInfo | null> {
  return getVideoInfo(videoId)
}
