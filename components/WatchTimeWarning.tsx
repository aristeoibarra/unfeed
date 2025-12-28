"use client"

import { useEffect } from "react"
import { useWatchTimeLimit } from "@/contexts/WatchTimeLimitContext"
import { useToast } from "@/components/ui/use-toast"

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} minutes`
  if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`
  return `${hours}h ${mins}m`
}

export function WatchTimeWarning() {
  const { toast } = useToast()
  const {
    status,
    showWarningToast,
    setShowWarningToast,
    setAcknowledgedWarning
  } = useWatchTimeLimit()

  useEffect(() => {
    if (!showWarningToast || !status) return

    const { dailyMinutes, weeklyMinutes, dailyLimit, weeklyLimit, isDailyWarning, isWeeklyWarning } = status

    let message = ""

    if (isDailyWarning && dailyLimit) {
      const remaining = dailyLimit - dailyMinutes
      message = `You've used ${formatMinutes(dailyMinutes)} today. ${formatMinutes(remaining)} remaining until your daily limit.`
    } else if (isWeeklyWarning && weeklyLimit) {
      const remaining = weeklyLimit - weeklyMinutes
      message = `You've used ${formatMinutes(weeklyMinutes)} this week. ${formatMinutes(remaining)} remaining until your weekly limit.`
    }

    if (message) {
      toast({
        title: "Approaching watch time limit",
        description: message,
      })
    }

    // Mark as acknowledged so we don't show it again for this period
    setAcknowledgedWarning(true)
    setShowWarningToast(false)
  }, [showWarningToast, status, toast, setShowWarningToast, setAcknowledgedWarning])

  return null
}
