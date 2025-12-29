import Image from "next/image"
import { getAllStats } from "@/actions/stats"
import {
  BarChart3,
  ArrowLeft,
  Clock,
  PlayCircle,
  CheckCircle2,
  Flame,
  Moon,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export const metadata = {
  title: "Stats - Unfeed",
  description: "Your watch time analytics and patterns"
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "pm" : "am"
  const displayHour = hour % 12 || 12
  return `${displayHour}${suffix}`
}

export default async function StatsPage() {
  const stats = await getAllStats()

  const weeklyPercentage = stats.weeklyLimit
    ? Math.min(100, (stats.weeklyMinutes / stats.weeklyLimit) * 100)
    : null

  const dailyPercentage = stats.dailyLimit
    ? Math.min(100, (stats.dailyMinutes / stats.dailyLimit) * 100)
    : null

  // Calculate max channel time for progress bars
  const maxChannelMinutes = stats.topChannels[0]?.minutes || 1

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <BarChart3
              className="h-6 w-6 text-purple-600 dark:text-purple-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your watch time analytics
            </p>
          </div>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to feed
          </Button>
        </Link>
      </header>

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">
                {formatTime(stats.weeklyMinutes)}
              </span>
              {stats.weeklyLimit && (
                <span className="text-gray-500 dark:text-gray-400">
                  / {formatTime(stats.weeklyLimit)} limit
                </span>
              )}
            </div>
            {weeklyPercentage !== null && (
              <Progress
                value={weeklyPercentage}
                className={`h-3 ${
                  weeklyPercentage >= 100
                    ? "[&>div]:bg-red-500"
                    : weeklyPercentage >= 80
                      ? "[&>div]:bg-orange-500"
                      : "[&>div]:bg-green-500"
                }`}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time & Video Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Today
              </span>
              <span className="text-2xl font-bold">
                {formatTime(stats.dailyMinutes)}
              </span>
              {dailyPercentage !== null && (
                <Progress
                  value={dailyPercentage}
                  className={`h-1.5 mt-1 ${
                    dailyPercentage >= 100
                      ? "[&>div]:bg-red-500"
                      : dailyPercentage >= 80
                        ? "[&>div]:bg-orange-500"
                        : "[&>div]:bg-blue-500"
                  }`}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Daily Average
              </span>
              <span className="text-2xl font-bold">
                {formatTime(stats.dailyAverage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <PlayCircle className="h-4 w-4" />
                Videos
              </span>
              <span className="text-2xl font-bold">{stats.videosWeek}</span>
              <span className="text-xs text-gray-500">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </span>
              <span className="text-2xl font-bold">
                {stats.completionRate.completed}
                <span className="text-base font-normal text-gray-500 ml-1">
                  ({stats.completionRate.rate}%)
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Channels */}
      {stats.topChannels.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Channels
              <span className="text-sm font-normal text-gray-500">
                this week
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topChannels.map((channel, index) => (
                <div key={channel.channelId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 w-4">
                        {index + 1}.
                      </span>
                      <Link
                        href={`/subscription/${channel.channelId}`}
                        className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {channel.channelName}
                      </Link>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatTime(channel.minutes)}
                    </span>
                  </div>
                  <Progress
                    value={(channel.minutes / maxChannelMinutes) * 100}
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patterns (TDA) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Watch Streak */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <span className="font-medium">
                  {stats.watchStreak} day streak
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.watchStreak > 0
                    ? "Keep it going!"
                    : "Start watching to build a streak"}
                </p>
              </div>
            </div>

            {/* Most Active Time */}
            {stats.mostActiveHour && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div>
                  <span className="font-medium">
                    Most active: {formatHour(stats.mostActiveHour.hour)} -{" "}
                    {formatHour((stats.mostActiveHour.hour + 2) % 24)}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stats.mostActiveHour.hour >= 6 &&
                    stats.mostActiveHour.hour < 22
                      ? "Healthy viewing hours"
                      : "Consider adjusting your viewing time"}
                  </p>
                </div>
              </div>
            )}

            {/* Late Night Sessions */}
            {stats.lateNightSessions.count > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Moon className="h-5 w-5 text-red-500" />
                <div>
                  <span className="font-medium">
                    {stats.lateNightSessions.count} late night{" "}
                    {stats.lateNightSessions.count === 1
                      ? "session"
                      : "sessions"}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Watching between 12am-5am this week
                  </p>
                </div>
              </div>
            )}

            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold">{stats.sessionsPerDay}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  sessions/day
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {formatTime(stats.avgSessionDuration)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  avg session
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Rewatched Videos */}
      {stats.mostRewatched.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Most Rewatched
              <span className="text-sm font-normal text-gray-500 ml-2">
                last 30 days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.mostRewatched.map((video) => (
                <Link
                  key={video.videoId}
                  href={`/watch/${video.videoId}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative w-20 h-12 flex-shrink-0">
                    <Image
                      src={video.thumbnail}
                      alt=""
                      fill
                      className="object-cover rounded"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Watched {video.count} times
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              This Month
            </div>
            <div className="text-2xl font-bold">
              {formatTime(stats.monthlyMinutes)}
            </div>
          </CardContent>
        </Card>

        {stats.mostActiveDay && (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Most Active Day
              </div>
              <div className="text-2xl font-bold">{stats.mostActiveDay.day}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Videos Today
            </div>
            <div className="text-2xl font-bold">{stats.videosToday}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
