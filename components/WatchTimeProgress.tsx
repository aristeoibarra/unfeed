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
      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />

      <div className="flex items-center gap-4">
        {/* Daily progress */}
        {hasDaily && (
          <div className="flex items-center gap-2">
            {showLabel && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">Today:</span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isDailyExceeded
                      ? "bg-red-500"
                      : isDailyWarning
                        ? "bg-orange-500"
                        : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(100, dailyPercentage || 0)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isDailyExceeded
                    ? "text-red-500"
                    : isDailyWarning
                      ? "text-orange-500"
                      : "text-gray-600 dark:text-gray-300"
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
              <span className="text-gray-500 dark:text-gray-400 text-xs">Week:</span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isWeeklyExceeded
                      ? "bg-red-500"
                      : isWeeklyWarning
                        ? "bg-orange-500"
                        : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(100, weeklyPercentage || 0)}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  isWeeklyExceeded
                    ? "text-red-500"
                    : isWeeklyWarning
                      ? "text-orange-500"
                      : "text-gray-600 dark:text-gray-300"
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
