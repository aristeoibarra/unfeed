import Image from "next/image"
import { getAllStats } from "@/actions/stats"
import {
  BarChart3,
  Clock,
  PlayCircle,
  CheckCircle2,
  Flame,
  Moon,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  RefreshCw
} from "lucide-react"
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

function formatTimeDetailed(minutes: number): { value: string; unit: string } {
  if (minutes < 60) {
    return { value: String(minutes), unit: "min" }
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return { value: String(hours), unit: hours === 1 ? "hour" : "hours" }
  }
  return { value: `${hours}h ${mins}`, unit: "min" }
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? "pm" : "am"
  const displayHour = hour % 12 || 12
  return `${displayHour}${suffix}`
}

// Circular progress component
function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "var(--primary)"
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
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
  const totalChannelMinutes = stats.topChannels.reduce((sum, c) => sum + c.minutes, 0)

  // Get color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "hsl(var(--destructive))"
    if (percentage >= 80) return "hsl(var(--warning))"
    return "hsl(var(--success))"
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
          <p className="text-muted-foreground text-sm">
            Your watch time analytics
          </p>
        </div>
      </header>

      {/* Hero Section - Weekly Overview with Circular Progress */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Progress */}
            {stats.weeklyLimit ? (
              <CircularProgress
                value={stats.weeklyMinutes}
                max={stats.weeklyLimit}
                size={140}
                strokeWidth={12}
                color={getProgressColor(weeklyPercentage || 0)}
              />
            ) : (
              <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Clock className="h-12 w-12 text-primary/60" />
              </div>
            )}

            {/* Stats Content */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                  This Week
                </p>
                <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                    {formatTime(stats.weeklyMinutes)}
                  </span>
                  {stats.weeklyLimit && (
                    <span className="text-muted-foreground">
                      / {formatTime(stats.weeklyLimit)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex gap-6 justify-center sm:justify-start">
                <div>
                  <p className="text-2xl font-semibold">{stats.videosWeek}</p>
                  <p className="text-xs text-muted-foreground">videos</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold">{stats.completionRate.rate}%</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-semibold">{formatTime(stats.dailyAverage)}</p>
                  <p className="text-xs text-muted-foreground">daily avg</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Today</span>
              </div>
              <span className="text-2xl font-bold">{formatTime(stats.dailyMinutes)}</span>
            </div>
            {stats.dailyLimit ? (
              <div className="space-y-2">
                <Progress
                  value={dailyPercentage || 0}
                  className={`h-2 ${
                    (dailyPercentage || 0) >= 100
                      ? "[&>div]:bg-destructive"
                      : (dailyPercentage || 0) >= 80
                        ? "[&>div]:bg-warning"
                        : "[&>div]:bg-success"
                  }`}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formatTime(stats.dailyLimit)} daily limit
                </p>
              </div>
            ) : (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${Math.min(100, (stats.dailyMinutes / 120) * 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-1">
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Videos today</span>
            </div>
            <span className="text-3xl font-bold">{stats.videosToday}</span>
          </CardContent>
        </Card>
      </div>

      {/* Patterns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Watch Streak */}
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.watchStreak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </CardContent>
        </Card>

        {/* Sessions per Day */}
        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-info mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.sessionsPerDay}</p>
            <p className="text-xs text-muted-foreground">sessions/day</p>
          </CardContent>
        </Card>

        {/* Avg Session */}
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-3xl font-bold">{formatTime(stats.avgSessionDuration)}</p>
            <p className="text-xs text-muted-foreground">avg session</p>
          </CardContent>
        </Card>

        {/* Monthly Total */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">{formatTime(stats.monthlyMinutes)}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Channels */}
      {stats.topChannels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Top Channels
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                this week
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topChannels.map((channel, index) => {
              const percentage = totalChannelMinutes > 0
                ? Math.round((channel.minutes / totalChannelMinutes) * 100)
                : 0
              return (
                <Link
                  key={channel.channelId}
                  href={`/subscription/${channel.channelId}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Rank badge */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-warning/20 text-warning" :
                    index === 1 ? "bg-muted text-muted-foreground" :
                    index === 2 ? "bg-warning/10 text-warning/70" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Channel info with inline progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {channel.channelName}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums ml-2">
                        {formatTime(channel.minutes)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                        style={{ width: `${(channel.minutes / maxChannelMinutes) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                    {percentage}%
                  </span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Activity Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Most Active Time */}
        {stats.mostActiveHour && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Peak Activity</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatHour(stats.mostActiveHour.hour)} - {formatHour((stats.mostActiveHour.hour + 2) % 24)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.mostActiveHour.hour >= 6 && stats.mostActiveHour.hour < 22
                      ? "Healthy viewing hours"
                      : "Consider adjusting your viewing time"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Most Active Day */}
        {stats.mostActiveDay && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Most Active Day</p>
                  <p className="text-2xl font-bold mt-1">{stats.mostActiveDay.day}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(stats.mostActiveDay.minutes)} watched on average
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Late Night Warning */}
        {stats.lateNightSessions.count > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Moon className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Late Night Sessions</p>
                  <p className="text-2xl font-bold mt-1">{stats.lateNightSessions.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Watching between 12am-5am this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Most Rewatched Videos */}
      {stats.mostRewatched.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-info" />
              Most Rewatched
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                last 30 days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.mostRewatched.map((video) => (
                <Link
                  key={video.videoId}
                  href={`/watch/${video.videoId}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="relative w-24 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    <Image
                      src={video.thumbnail}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {video.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <RefreshCw className="h-3 w-3" />
                      {video.count} times
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
