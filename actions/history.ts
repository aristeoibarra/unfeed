"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

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

  await prisma.watchHistory.update({
    where: { id: historyId },
    data: { progress, completed }
  })
}

export async function getHistory(page: number = 1, search?: string) {
  const skip = (page - 1) * HISTORY_PER_PAGE

  const where = search ? {
    OR: [
      { title: { contains: search } },
      { channelName: { contains: search } }
    ]
  } : {}

  const [entries, total] = await Promise.all([
    prisma.watchHistory.findMany({
      where,
      orderBy: { watchedAt: "desc" },
      skip,
      take: HISTORY_PER_PAGE
    }),
    prisma.watchHistory.count({ where })
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
      OR: [
        { title: { contains: query } },
        { channelName: { contains: query } }
      ]
    },
    orderBy: { watchedAt: "desc" },
    take: 50
  })

  return entries.map(formatEntry)
}

export async function removeFromHistory(historyId: number): Promise<void> {
  await prisma.watchHistory.delete({
    where: { id: historyId }
  })

  revalidatePath("/history")
}

export async function clearHistory(): Promise<void> {
  await prisma.watchHistory.deleteMany()
  revalidatePath("/history")
}

export async function getHistoryCount(): Promise<number> {
  return prisma.watchHistory.count()
}

// Get the latest history entry for a specific video (for resume functionality)
export async function getVideoProgress(videoId: string): Promise<{
  historyId: number
  progress: number
  duration: number | null
  completed: boolean
} | null> {
  const entry = await prisma.watchHistory.findFirst({
    where: { videoId },
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
