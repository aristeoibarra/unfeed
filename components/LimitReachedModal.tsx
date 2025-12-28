"use client"

import { useWatchTimeLimit } from "@/contexts/WatchTimeLimitContext"
import { usePlayer } from "@/contexts/PlayerContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle } from "lucide-react"

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} minutes`
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`
  return `${hours}h ${mins}m`
}

export function LimitReachedModal() {
  const {
    status,
    showLimitModal,
    setShowLimitModal,
    setAcknowledgedLimit
  } = useWatchTimeLimit()
  const { stop, pause } = usePlayer()

  if (!status) return null

  const { dailyMinutes, weeklyMinutes, dailyLimit, weeklyLimit, isDailyExceeded, isWeeklyExceeded } = status

  const isDaily = isDailyExceeded
  const limitType = isDaily ? "daily" : "weekly"
  const usedMinutes = isDaily ? dailyMinutes : weeklyMinutes
  const limit = isDaily ? dailyLimit : weeklyLimit

  function handleStopWatching() {
    stop()
    setShowLimitModal(false)
    setAcknowledgedLimit(true)
  }

  function handleContinue() {
    setShowLimitModal(false)
    setAcknowledgedLimit(true)
  }

  function handleTakeBreak() {
    pause()
    setShowLimitModal(false)
    setAcknowledgedLimit(true)
  }

  return (
    <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-center">
            {limitType === "daily" ? "Daily" : "Weekly"} limit reached
          </DialogTitle>
          <DialogDescription className="text-center">
            You&apos;ve watched for {formatMinutes(usedMinutes)} {limitType === "daily" ? "today" : "this week"}.
            {limit && (
              <> Your {limitType} limit is {formatMinutes(limit)}.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Taking breaks is important for focus and well-being</span>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleStopWatching} className="w-full">
            Stop watching
          </Button>
          <Button onClick={handleTakeBreak} variant="outline" className="w-full">
            Take a break
          </Button>
          <button
            onClick={handleContinue}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
          >
            Continue anyway
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
