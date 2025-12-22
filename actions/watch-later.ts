"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const videoIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid video ID format")

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
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return false
  }
  const item = await prisma.watchLater.findUnique({
    where: { videoId }
  })
  return !!item
}

export async function addToWatchLater(video: VideoData): Promise<void> {
  const validated = videoIdSchema.safeParse(video.videoId)
  if (!validated.success) {
    throw new Error("Invalid video ID")
  }
  await prisma.watchLater.upsert({
    where: { videoId: video.videoId },
    update: {},
    create: {
      videoId: video.videoId,
      title: video.title.slice(0, 500), // Limit title length
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelName: video.channelName.slice(0, 200), // Limit name length
    }
  })
  revalidatePath("/")
  revalidatePath("/watch-later")
}

export async function removeFromWatchLater(videoId: string): Promise<void> {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return
  }
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
