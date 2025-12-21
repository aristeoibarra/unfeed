"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface VideoData {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
}

export async function getWatchLater() {
  return prisma.watchLater.findMany({
    orderBy: { addedAt: "desc" }
  })
}

export async function getWatchLaterIds(): Promise<string[]> {
  const items = await prisma.watchLater.findMany({
    select: { videoId: true }
  })
  return items.map(item => item.videoId)
}

export async function isInWatchLater(videoId: string): Promise<boolean> {
  const item = await prisma.watchLater.findUnique({
    where: { videoId }
  })
  return !!item
}

export async function addToWatchLater(video: VideoData): Promise<void> {
  await prisma.watchLater.upsert({
    where: { videoId: video.videoId },
    update: {},
    create: {
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelName: video.channelName,
    }
  })
  revalidatePath("/")
  revalidatePath("/watch-later")
}

export async function removeFromWatchLater(videoId: string): Promise<void> {
  await prisma.watchLater.delete({
    where: { videoId }
  }).catch(() => {
    // Ignore if not found
  })
  revalidatePath("/")
  revalidatePath("/watch-later")
}

export async function toggleWatchLater(video: VideoData): Promise<boolean> {
  const exists = await isInWatchLater(video.videoId)

  if (exists) {
    await removeFromWatchLater(video.videoId)
    return false
  } else {
    await addToWatchLater(video)
    return true
  }
}
