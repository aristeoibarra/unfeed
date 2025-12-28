"use server"

import { prisma } from "@/lib/db"
import { getDailyWatchTime, getWeeklyWatchTime, getSettings } from "./settings"
import type { StatsData } from "@/types/stats"

// Helper to get start of current month
function getStartOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// Helper to get start of current week (Monday)
function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

// Helper to get start of today
function getStartOfDay(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export async function getMonthlyWatchTime(): Promise<number> {
  const startOfMonth = getStartOfMonth()

  const result = await prisma.watchHistory.aggregate({
    where: {
      watchedAt: { gte: startOfMonth }
    },
    _sum: { progress: true }
  })

  return Math.floor((result._sum.progress || 0) / 60)
}

export async function getDailyAverage(): Promise<number> {
  // Get all unique days with watch history in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const entries = await prisma.watchHistory.findMany({
    where: {
      watchedAt: { gte: thirtyDaysAgo }
    },
    select: {
      watchedAt: true,
      progress: true
    }
  })

  if (entries.length === 0) return 0

  // Group by day and sum progress
  const dailyTotals = new Map<string, number>()
  for (const entry of entries) {
    const dayKey = entry.watchedAt.toISOString().split("T")[0]
    const current = dailyTotals.get(dayKey) || 0
    dailyTotals.set(dayKey, current + (entry.progress || 0))
  }

  // Calculate average
  const totalMinutes = Array.from(dailyTotals.values()).reduce(
    (sum, seconds) => sum + Math.floor(seconds / 60),
    0
  )
  return Math.floor(totalMinutes / dailyTotals.size)
}

export async function getMostActiveDay(): Promise<{
  day: string
  minutes: number
} | null> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const entries = await prisma.watchHistory.findMany({
    where: {
      watchedAt: { gte: thirtyDaysAgo }
    },
    select: {
      watchedAt: true,
      progress: true
    }
  })

  if (entries.length === 0) return null

  // Group by day of week
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
  const dayTotals = new Map<number, number>()

  for (const entry of entries) {
    const dayOfWeek = entry.watchedAt.getDay()
    const current = dayTotals.get(dayOfWeek) || 0
    dayTotals.set(dayOfWeek, current + (entry.progress || 0))
  }

  // Find the day with most watch time
  let maxDay = 0
  let maxSeconds = 0
  for (const [day, seconds] of dayTotals) {
    if (seconds > maxSeconds) {
      maxDay = day
      maxSeconds = seconds
    }
  }

  return {
    day: dayNames[maxDay],
    minutes: Math.floor(maxSeconds / 60)
  }
}

export async function getMostActiveHour(): Promise<{
  hour: number
  minutes: number
} | null> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const entries = await prisma.watchHistory.findMany({
    where: {
      watchedAt: { gte: thirtyDaysAgo }
    },
    select: {
      watchedAt: true,
      progress: true
    }
  })

  if (entries.length === 0) return null

  // Group by hour
  const hourTotals = new Map<number, number>()

  for (const entry of entries) {
    const hour = entry.watchedAt.getHours()
    const current = hourTotals.get(hour) || 0
    hourTotals.set(hour, current + (entry.progress || 0))
  }

  // Find the hour with most watch time
  let maxHour = 0
  let maxSeconds = 0
  for (const [hour, seconds] of hourTotals) {
    if (seconds > maxSeconds) {
      maxHour = hour
      maxSeconds = seconds
    }
  }

  return {
    hour: maxHour,
    minutes: Math.floor(maxSeconds / 60)
  }
}

export async function getVideosWatchedCount(
  period: "day" | "week" | "month"
): Promise<number> {
  let startDate: Date
  if (period === "day") {
    startDate = getStartOfDay()
  } else if (period === "week") {
    startDate = getStartOfWeek()
  } else {
    startDate = getStartOfMonth()
  }

  const count = await prisma.watchHistory.count({
    where: {
      watchedAt: { gte: startDate }
    }
  })

  return count
}

export async function getCompletionRate(): Promise<{
  completed: number
  total: number
  rate: number
}> {
  const startOfWeek = getStartOfWeek()

  const [completed, total] = await Promise.all([
    prisma.watchHistory.count({
      where: {
        watchedAt: { gte: startOfWeek },
        completed: true
      }
    }),
    prisma.watchHistory.count({
      where: {
        watchedAt: { gte: startOfWeek }
      }
    })
  ])

  return {
    completed,
    total,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

export async function getMostRewatchedVideos(
  limit: number = 5
): Promise<{ videoId: string; title: string; thumbnail: string; count: number }[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const videos = await prisma.watchHistory.groupBy({
    by: ["videoId"],
    where: {
      watchedAt: { gte: thirtyDaysAgo }
    },
    _count: { videoId: true },
    having: {
      videoId: { _count: { gt: 1 } }
    },
    orderBy: { _count: { videoId: "desc" } },
    take: limit
  })

  if (videos.length === 0) return []

  // Get video details
  const videoDetails = await Promise.all(
    videos.map(async (v) => {
      const detail = await prisma.watchHistory.findFirst({
        where: { videoId: v.videoId },
        select: { title: true, thumbnail: true }
      })
      return {
        videoId: v.videoId,
        title: detail?.title || "Unknown",
        thumbnail: detail?.thumbnail || "",
        count: v._count.videoId
      }
    })
  )

  return videoDetails
}

export async function getTopChannelsByWatchTime(
  limit: number = 5
): Promise<{ channelName: string; channelId: string; minutes: number }[]> {
  const startOfWeek = getStartOfWeek()

  const channels = await prisma.watchHistory.groupBy({
    by: ["channelId", "channelName"],
    where: {
      watchedAt: { gte: startOfWeek }
    },
    _sum: { progress: true },
    orderBy: { _sum: { progress: "desc" } },
    take: limit
  })

  return channels.map((c) => ({
    channelName: c.channelName,
    channelId: c.channelId,
    minutes: Math.floor((c._sum.progress || 0) / 60)
  }))
}

export async function getWatchStreak(): Promise<number> {
  // Get all unique days with at least one watch
  const entries = await prisma.watchHistory.findMany({
    select: { watchedAt: true },
    orderBy: { watchedAt: "desc" }
  })

  if (entries.length === 0) return 0

  // Get unique days
  const uniqueDays = new Set<string>()
  for (const entry of entries) {
    uniqueDays.add(entry.watchedAt.toISOString().split("T")[0])
  }

  const sortedDays = Array.from(uniqueDays).sort().reverse()

  // Count consecutive days from today (or yesterday if today has no watches)
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  let streak = 0
  let checkDate = sortedDays[0] === today ? today : yesterday

  // If most recent day is not today or yesterday, streak is 0
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return 0
  }

  for (const day of sortedDays) {
    if (day === checkDate) {
      streak++
      // Move to previous day
      const prevDate = new Date(checkDate)
      prevDate.setDate(prevDate.getDate() - 1)
      checkDate = prevDate.toISOString().split("T")[0]
    } else if (day < checkDate) {
      // Gap found, stop counting
      break
    }
  }

  return streak
}

export async function getSessionStats(): Promise<{
  sessionsPerDay: number
  avgSessionDuration: number
}> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const entries = await prisma.watchHistory.findMany({
    where: {
      watchedAt: { gte: sevenDaysAgo }
    },
    select: {
      watchedAt: true,
      progress: true
    },
    orderBy: { watchedAt: "asc" }
  })

  if (entries.length === 0) {
    return { sessionsPerDay: 0, avgSessionDuration: 0 }
  }

  // Define session gap as 30 minutes
  const SESSION_GAP_MS = 30 * 60 * 1000

  const sessions: { start: Date; totalSeconds: number }[] = []
  let currentSession = { start: entries[0].watchedAt, totalSeconds: 0 }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    if (i === 0) {
      currentSession.totalSeconds += entry.progress || 0
      continue
    }

    const prevEntry = entries[i - 1]
    const gap = entry.watchedAt.getTime() - prevEntry.watchedAt.getTime()

    if (gap > SESSION_GAP_MS) {
      // New session
      sessions.push(currentSession)
      currentSession = { start: entry.watchedAt, totalSeconds: entry.progress || 0 }
    } else {
      currentSession.totalSeconds += entry.progress || 0
    }
  }
  sessions.push(currentSession)

  // Calculate sessions per day
  const uniqueDays = new Set<string>()
  for (const entry of entries) {
    uniqueDays.add(entry.watchedAt.toISOString().split("T")[0])
  }
  const daysCount = uniqueDays.size || 1

  const sessionsPerDay = Math.round((sessions.length / daysCount) * 10) / 10

  // Calculate average session duration in minutes
  const totalDuration = sessions.reduce((sum, s) => sum + s.totalSeconds, 0)
  const avgSessionDuration = Math.floor(totalDuration / sessions.length / 60)

  return { sessionsPerDay, avgSessionDuration }
}

export async function getLateNightSessions(): Promise<{
  count: number
  lastOccurrence: Date | null
}> {
  const startOfWeek = getStartOfWeek()

  // Late night = 12am to 5am (hours 0-4)
  const entries = await prisma.watchHistory.findMany({
    where: {
      watchedAt: { gte: startOfWeek }
    },
    select: { watchedAt: true },
    orderBy: { watchedAt: "desc" }
  })

  const lateNightEntries = entries.filter((e) => {
    const hour = e.watchedAt.getHours()
    return hour >= 0 && hour < 5
  })

  // Group into sessions (30 min gap)
  if (lateNightEntries.length === 0) {
    return { count: 0, lastOccurrence: null }
  }

  const SESSION_GAP_MS = 30 * 60 * 1000
  let sessionCount = 1
  for (let i = 1; i < lateNightEntries.length; i++) {
    const gap =
      lateNightEntries[i - 1].watchedAt.getTime() -
      lateNightEntries[i].watchedAt.getTime()
    if (gap > SESSION_GAP_MS) {
      sessionCount++
    }
  }

  return {
    count: sessionCount,
    lastOccurrence: lateNightEntries[0].watchedAt
  }
}

export async function getAllStats(): Promise<StatsData> {
  const [
    dailyMinutes,
    weeklyMinutes,
    monthlyMinutes,
    dailyAverage,
    mostActiveDay,
    mostActiveHour,
    videosToday,
    videosWeek,
    videosMonth,
    completionRate,
    mostRewatched,
    topChannels,
    watchStreak,
    sessionStats,
    lateNightSessions,
    settings
  ] = await Promise.all([
    getDailyWatchTime(),
    getWeeklyWatchTime(),
    getMonthlyWatchTime(),
    getDailyAverage(),
    getMostActiveDay(),
    getMostActiveHour(),
    getVideosWatchedCount("day"),
    getVideosWatchedCount("week"),
    getVideosWatchedCount("month"),
    getCompletionRate(),
    getMostRewatchedVideos(5),
    getTopChannelsByWatchTime(5),
    getWatchStreak(),
    getSessionStats(),
    getLateNightSessions(),
    getSettings()
  ])

  return {
    dailyMinutes,
    weeklyMinutes,
    monthlyMinutes,
    dailyAverage,
    mostActiveDay,
    mostActiveHour,
    videosToday,
    videosWeek,
    videosMonth,
    completionRate,
    mostRewatched,
    topChannels,
    watchStreak,
    sessionsPerDay: sessionStats.sessionsPerDay,
    avgSessionDuration: sessionStats.avgSessionDuration,
    lateNightSessions,
    dailyLimit: settings.dailyLimitMinutes,
    weeklyLimit: settings.weeklyLimitMinutes
  }
}
