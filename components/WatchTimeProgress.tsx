"use client"

import { useWatchTimeLimit } from "@/contexts/WatchTimeLimitContext"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

interface WatchTimeProgressProps {
  className?: string
  showLabel?: boolean
}

export function WatchTimeProgress({ className, showLabel = true }: WatchTimeProgressProps) {
  const { status, hasLimitsConfigured, isLoading } = useWatchTimeLimit()

  if (isLoading || !hasLimitsConfigured || !status) {
    return null
  }

  const {
    dailyMinutes,
    weeklyMinutes,
    dailyLimit,
    weeklyLimit,
    dailyPercentage,
    weeklyPercentage,
    isDailyWarning,
    isWeeklyWarning,
    isDailyExceeded,
    isWeeklyExceeded
  } = status

  const hasDaily = dailyLimit !== null
  const hasWeekly = weeklyLimit !== null

  return (
    <div className={cn("flex items-center gap-3 text-sm", className)}>
      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-4">
        {/* Daily progress */}
        {hasDaily && (
          <div className="flex items-center gap-2">
            {showLabel && (
              <span className="text-muted-foreground text-xs">Today:</span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isDailyExceeded
                      ? "bg-destructive"
                      : isDailyWarning
                        ? "bg-warning"
                        : "bg-success"
                  )}
                  style={{ width: `${Math.min(100, dailyPercentage || 0)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isDailyExceeded
                    ? "text-destructive"
                    : isDailyWarning
                      ? "text-warning"
                      : "text-foreground"
                )}
              >
                {formatMinutes(dailyMinutes)}/{formatMinutes(dailyLimit)}
              </span>
            </div>
          </div>
        )}

        {/* Weekly progress */}
        {hasWeekly && (
          <div className="flex items-center gap-2">
            {showLabel && (
              <span className="text-muted-foreground text-xs">Week:</span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isWeeklyExceeded
                      ? "bg-destructive"
                      : isWeeklyWarning
                        ? "bg-warning"
                        : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, weeklyPercentage || 0)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isWeeklyExceeded
                    ? "text-destructive"
                    : isWeeklyWarning
                      ? "text-warning"
                      : "text-foreground"
                )}
              >
                {formatMinutes(weeklyMinutes)}/{formatMinutes(weeklyLimit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
