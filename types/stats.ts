export interface StatsData {
  // Time stats
  dailyMinutes: number
  weeklyMinutes: number
  monthlyMinutes: number
  dailyAverage: number
  mostActiveDay: { day: string; minutes: number } | null
  mostActiveHour: { hour: number; minutes: number } | null

  // Video stats
  videosToday: number
  videosWeek: number
  videosMonth: number
  completionRate: { completed: number; total: number; rate: number }
  mostRewatched: {
    videoId: string
    title: string
    thumbnail: string
    count: number
  }[]

  // Channel stats
  topChannels: { channelName: string; channelId: string; minutes: number }[]

  // Pattern stats (TDA)
  watchStreak: number
  sessionsPerDay: number
  avgSessionDuration: number
  lateNightSessions: { count: number; lastOccurrence: Date | null }

  // Limits (from existing infrastructure)
  dailyLimit: number | null
  weeklyLimit: number | null
}
