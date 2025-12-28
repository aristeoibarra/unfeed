"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface AppSettings {
  hideDislikedFromFeed: boolean
  dailyLimitMinutes: number | null
  weeklyLimitMinutes: number | null
  preferredLanguage: "es" | "en"
  autoShowSubtitles: boolean
  syncIntervalHours: 3 | 6 | 12 | 24
}

export interface WatchTimeStatus {
  dailyMinutes: number
  weeklyMinutes: number
  dailyLimit: number | null
  weeklyLimit: number | null
  dailyPercentage: number | null
  weeklyPercentage: number | null
  isDailyWarning: boolean
  isWeeklyWarning: boolean
  isDailyExceeded: boolean
  isWeeklyExceeded: boolean
}

const DEFAULT_SETTINGS = {
  hideDislikedFromFeed: true,
  dailyLimitMinutes: null,
  weeklyLimitMinutes: null,
  preferredLanguage: "es" as const,
  autoShowSubtitles: false,
  syncIntervalHours: 6 as const
}

async function getOrCreateSettings() {
  let settings = await prisma.settings.findFirst()

  if (!settings) {
    settings = await prisma.settings.create({
      data: DEFAULT_SETTINGS
    })
  }

  return settings
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await getOrCreateSettings()
  return {
    hideDislikedFromFeed: settings.hideDislikedFromFeed,
    dailyLimitMinutes: settings.dailyLimitMinutes,
    weeklyLimitMinutes: settings.weeklyLimitMinutes,
    preferredLanguage: settings.preferredLanguage as "es" | "en",
    autoShowSubtitles: settings.autoShowSubtitles,
    syncIntervalHours: settings.syncIntervalHours as 3 | 6 | 12 | 24
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const settings = await getOrCreateSettings()

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data
  })

  revalidatePath("/")
  revalidatePath("/subscriptions")
  revalidatePath("/settings")

  return {
    hideDislikedFromFeed: updated.hideDislikedFromFeed,
    dailyLimitMinutes: updated.dailyLimitMinutes,
    weeklyLimitMinutes: updated.weeklyLimitMinutes,
    preferredLanguage: updated.preferredLanguage as "es" | "en",
    autoShowSubtitles: updated.autoShowSubtitles,
    syncIntervalHours: updated.syncIntervalHours as 3 | 6 | 12 | 24
  }
}

export async function updateSyncInterval(hours: 3 | 6 | 12 | 24): Promise<AppSettings> {
  return updateSettings({ syncIntervalHours: hours })
}

export async function getSyncIntervalHours(): Promise<number> {
  const settings = await getOrCreateSettings()
  return settings.syncIntervalHours
}

export async function toggleHideDislikedFromFeed(): Promise<boolean> {
  const settings = await getOrCreateSettings()

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { hideDislikedFromFeed: !settings.hideDislikedFromFeed }
  })

  revalidatePath("/")

  return updated.hideDislikedFromFeed
}

export async function updateTimeLimits(
  dailyLimitMinutes: number | null,
  weeklyLimitMinutes: number | null
): Promise<AppSettings> {
  return updateSettings({ dailyLimitMinutes, weeklyLimitMinutes })
}

export async function getDailyWatchTime(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await prisma.watchHistory.aggregate({
    where: {
      watchedAt: { gte: today }
    },
    _sum: { progress: true }
  })

  // Return minutes (progress is stored in seconds)
  return Math.floor((result._sum.progress || 0) / 60)
}

export async function getWeeklyWatchTime(): Promise<number> {
  const now = new Date()
  const startOfWeek = new Date(now)
  // Get Monday of current week
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)

  const result = await prisma.watchHistory.aggregate({
    where: {
      watchedAt: { gte: startOfWeek }
    },
    _sum: { progress: true }
  })

  // Return minutes (progress is stored in seconds)
  return Math.floor((result._sum.progress || 0) / 60)
}

export async function getWatchTimeStatus(): Promise<WatchTimeStatus> {
  const [settings, dailyMinutes, weeklyMinutes] = await Promise.all([
    getSettings(),
    getDailyWatchTime(),
    getWeeklyWatchTime()
  ])

  const { dailyLimitMinutes, weeklyLimitMinutes } = settings

  const dailyPercentage = dailyLimitMinutes
    ? Math.min(100, (dailyMinutes / dailyLimitMinutes) * 100)
    : null

  const weeklyPercentage = weeklyLimitMinutes
    ? Math.min(100, (weeklyMinutes / weeklyLimitMinutes) * 100)
    : null

  // Warning at 80%, exceeded at 100%
  const WARNING_THRESHOLD = 80

  return {
    dailyMinutes,
    weeklyMinutes,
    dailyLimit: dailyLimitMinutes,
    weeklyLimit: weeklyLimitMinutes,
    dailyPercentage,
    weeklyPercentage,
    isDailyWarning: dailyPercentage !== null && dailyPercentage >= WARNING_THRESHOLD && dailyPercentage < 100,
    isWeeklyWarning: weeklyPercentage !== null && weeklyPercentage >= WARNING_THRESHOLD && weeklyPercentage < 100,
    isDailyExceeded: dailyPercentage !== null && dailyPercentage >= 100,
    isWeeklyExceeded: weeklyPercentage !== null && weeklyPercentage >= 100
  }
}
