"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type ReactionType = "like" | "dislike"

export async function getReaction(videoId: string): Promise<ReactionType | null> {
  const reaction = await prisma.videoReaction.findUnique({
    where: { videoId }
  })
  return reaction?.type as ReactionType | null
}

export async function getReactions(videoIds: string[]): Promise<Map<string, ReactionType>> {
  const reactions = await prisma.videoReaction.findMany({
    where: { videoId: { in: videoIds } }
  })

  const map = new Map<string, ReactionType>()
  for (const r of reactions) {
    map.set(r.videoId, r.type as ReactionType)
  }
  return map
}

export async function getLikedVideoIds(): Promise<string[]> {
  const reactions = await prisma.videoReaction.findMany({
    where: { type: "like" },
    select: { videoId: true }
  })
  return reactions.map(r => r.videoId)
}

export async function getDislikedVideoIds(): Promise<string[]> {
  const reactions = await prisma.videoReaction.findMany({
    where: { type: "dislike" },
    select: { videoId: true }
  })
  return reactions.map(r => r.videoId)
}

export async function setReaction(videoId: string, type: ReactionType): Promise<void> {
  const existing = await prisma.videoReaction.findUnique({
    where: { videoId }
  })

  if (existing) {
    if (existing.type === type) {
      // Same reaction - remove it
      await prisma.videoReaction.delete({
        where: { videoId }
      })
    } else {
      // Different reaction - update it
      await prisma.videoReaction.update({
        where: { videoId },
        data: { type }
      })
    }
  } else {
    // No existing reaction - create it
    await prisma.videoReaction.create({
      data: { videoId, type }
    })
  }

  revalidatePath("/")
  revalidatePath("/liked")
  revalidatePath(`/watch/${videoId}`)
}

export async function removeReaction(videoId: string): Promise<void> {
  await prisma.videoReaction.delete({
    where: { videoId }
  }).catch(() => {
    // Ignore if not found
  })

  revalidatePath("/")
  revalidatePath("/liked")
  revalidatePath(`/watch/${videoId}`)
}

interface VideoInfo {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  publishedAt: string
  duration: number | null
  description: string | null
  tags: string | null
  category: string | null
  viewCount: number | null
  likeCount: number | null
}

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

export async function getLikedVideos(page = 1, limit = 24) {
  const skip = (page - 1) * limit

  const likedReactions = await prisma.videoReaction.findMany({
    where: { type: "like" },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    skip,
    select: { videoId: true }
  })

  const hasMore = likedReactions.length > limit
  const ids = likedReactions.slice(0, limit).map(r => r.videoId)

  if (ids.length === 0) {
    return { videos: [], hasMore: false, total: 0 }
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { videoId: { in: ids } }
    }),
    prisma.videoReaction.count({
      where: { type: "like" }
    })
  ])

  // Sort by the order of liked (most recently liked first)
  const videoMap = new Map(videos.map(v => [v.videoId, v]))
  const sortedVideos = ids
    .map(id => videoMap.get(id))
    .filter((v): v is NonNullable<typeof v> => v != null)
    .map(formatVideo)

  return { videos: sortedVideos, hasMore, total }
}

export async function loadMoreLikedVideos(page = 2) {
  return getLikedVideos(page)
}
