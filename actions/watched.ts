"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getWatchedVideoIds(): Promise<string[]> {
  const watched = await prisma.watchedVideo.findMany({
    select: { videoId: true }
  })
  return watched.map(w => w.videoId)
}

export async function isWatched(videoId: string): Promise<boolean> {
  const watched = await prisma.watchedVideo.findUnique({
    where: { videoId }
  })
  return !!watched
}

export async function markAsWatched(videoId: string): Promise<void> {
  await prisma.watchedVideo.upsert({
    where: { videoId },
    update: { watchedAt: new Date() },
    create: { videoId }
  })
  revalidatePath("/")
}

export async function markAsUnwatched(videoId: string): Promise<void> {
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
