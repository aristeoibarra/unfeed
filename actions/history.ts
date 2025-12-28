"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { markAsWatched } from "./watched"

export interface HistoryEntry {
  id: number
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number | null
  watchedAt: string
  progress: number | null
  completed: boolean
}

export interface GroupedHistory {
  today: HistoryEntry[]
  yesterday: HistoryEntry[]
  thisWeek: HistoryEntry[]
  thisMonth: HistoryEntry[]
  older: HistoryEntry[]
}

const HISTORY_PER_PAGE = 30

function formatEntry(entry: {
  id: number
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration: number | null
  watchedAt: Date
  progress: number | null
  completed: boolean
}): HistoryEntry {
  return {
    ...entry,
    watchedAt: entry.watchedAt.toISOString()
  }
}

export async function addToHistory(videoId: string, videoData: {
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number | null
}): Promise<number> {
  const entry = await prisma.watchHistory.create({
    data: {
      videoId,
      title: videoData.title,
      thumbnail: videoData.thumbnail,
      channelId: videoData.channelId,
      channelName: videoData.channelName,
      duration: videoData.duration ?? null,
      watchedAt: new Date()
    }
  })

  revalidatePath("/history")
  return entry.id
}

export async function updateProgress(historyId: number, progress: number, duration: number): Promise<void> {
  const completed = duration > 0 && (progress / duration) >= 0.9

  const entry = await prisma.watchHistory.update({
    where: { id: historyId },
    data: { progress, completed },
    select: { videoId: true, completed: true }
  })

  // Auto-sync: mark video as watched when completed (>90%)
  if (completed) {
    await markAsWatched(entry.videoId)
  }
}

export async function getHistory(page: number = 1, search?: string) {
  const skip = (page - 1) * HISTORY_PER_PAGE

  // Only show non-deleted entries in UI
  const baseWhere = { deletedAt: null }
  const where = search ? {
    ...baseWhere,
    OR: [
      { title: { contains: search } },
      { channelName: { contains: search } }
    ]
  } : baseWhere

  const [entries, total] = await Promise.all([
    prisma.watchHistory.findMany({
      where,
      distinct: ['videoId'],
      orderBy: { watchedAt: "desc" },
      skip,
      take: HISTORY_PER_PAGE
    }),
    prisma.watchHistory.findMany({
      where,
      distinct: ['videoId'],
      select: { videoId: true }
    }).then(results => results.length)
  ])

  return {
    entries: entries.map(formatEntry),
    hasMore: skip + entries.length < total,
    total
  }
}

export async function searchHistory(query: string) {
  const entries = await prisma.watchHistory.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: query } },
        { channelName: { contains: query } }
      ]
    },
    distinct: ['videoId'],
    orderBy: { watchedAt: "desc" },
    take: 50
  })

  return entries.map(formatEntry)
}

export async function removeFromHistory(historyId: number): Promise<void> {
  // Soft delete: mark as deleted but keep for stats
  await prisma.watchHistory.update({
    where: { id: historyId },
    data: { deletedAt: new Date() }
  })

  revalidatePath("/history")
}

export async function clearHistory(): Promise<void> {
  // Soft delete all: mark as deleted but keep for stats
  await prisma.watchHistory.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() }
  })
  revalidatePath("/history")
}

export async function getHistoryCount(): Promise<number> {
  const uniqueVideos = await prisma.watchHistory.findMany({
    where: { deletedAt: null },
    distinct: ['videoId'],
    select: { videoId: true }
  })
  return uniqueVideos.length
}

// Get the latest history entry for a specific video (for resume functionality)
export async function getVideoProgress(videoId: string): Promise<{
  historyId: number
  progress: number
  duration: number | null
  completed: boolean
} | null> {
  const entry = await prisma.watchHistory.findFirst({
    where: { videoId, deletedAt: null },
    orderBy: { watchedAt: "desc" },
    select: {
      id: true,
      progress: true,
      duration: true,
      completed: true,
    },
  })

  if (!entry || !entry.progress || entry.progress <= 0) {
    return null
  }

  return {
    historyId: entry.id,
    progress: entry.progress,
    duration: entry.duration,
    completed: entry.completed,
  }
}
