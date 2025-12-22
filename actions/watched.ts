"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const videoIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid video ID format")

export async function getWatchedVideoIds(): Promise<string[]> {
  const watched = await prisma.watchedVideo.findMany({
    select: { videoId: true }
  })
  return watched.map(w => w.videoId)
}

export async function isWatched(videoId: string): Promise<boolean> {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return false
  }
  const watched = await prisma.watchedVideo.findUnique({
    where: { videoId }
  })
  return !!watched
}

export async function markAsWatched(videoId: string): Promise<void> {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    throw new Error("Invalid video ID")
  }
  await prisma.watchedVideo.upsert({
    where: { videoId },
    update: { watchedAt: new Date() },
    create: { videoId }
  })
  revalidatePath("/")
}

export async function markAsUnwatched(videoId: string): Promise<void> {
  const validated = videoIdSchema.safeParse(videoId)
  if (!validated.success) {
    return
  }
  await prisma.watchedVideo.delete({
    where: { videoId }
  }).catch(() => {
    // Ignore if not found
  })
  revalidatePath("/")
}

export async function toggleWatched(videoId: string): Promise<boolean> {
  const watched = await isWatched(videoId)

  if (watched) {
    await markAsUnwatched(videoId)
    return false
  } else {
    await markAsWatched(videoId)
    return true
  }
}
