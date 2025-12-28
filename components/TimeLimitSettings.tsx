"use client"

import { useState } from "react"
import { updateTimeLimits } from "@/actions/settings"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Clock, Loader2, X } from "lucide-react"

interface TimeLimitSettingsProps {
  initialDailyLimit: number | null
  initialWeeklyLimit: number | null
}

function minutesToHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function TimeLimitSettings({
  initialDailyLimit,
  initialWeeklyLimit
}: TimeLimitSettingsProps) {
  const { toast } = useToast()
  const [dailyLimit, setDailyLimit] = useState<string>(
    initialDailyLimit?.toString() ?? ""
  )
  const [weeklyLimit, setWeeklyLimit] = useState<string>(
    initialWeeklyLimit?.toString() ?? ""
  )
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const initialDailyStr = initialDailyLimit?.toString() ?? ""
  const initialWeeklyStr = initialWeeklyLimit?.toString() ?? ""

  function handleDailyChange(value: string) {
    setDailyLimit(value)
    setHasChanges(value !== initialDailyStr || weeklyLimit !== initialWeeklyStr)
  }

  function handleWeeklyChange(value: string) {
    setWeeklyLimit(value)
    setHasChanges(dailyLimit !== initialDailyStr || value !== initialWeeklyStr)
  }

  function clearDaily() {
    handleDailyChange("")
  }

  function clearWeekly() {
    handleWeeklyChange("")
  }

  async function handleSave() {
    setLoading(true)

    try {
      const daily = dailyLimit ? parseInt(dailyLimit, 10) : null
      const weekly = weeklyLimit ? parseInt(weeklyLimit, 10) : null

      // Validate
      if (daily !== null && (isNaN(daily) || daily < 1)) {
        toast({
          title: "Invalid daily limit",
          description: "Please enter a valid number of minutes (minimum 1).",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (weekly !== null && (isNaN(weekly) || weekly < 1)) {
        toast({
          title: "Invalid weekly limit",
          description: "Please enter a valid number of minutes (minimum 1).",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Weekly should be >= daily
      if (daily !== null && weekly !== null && weekly < daily) {
        toast({
          title: "Invalid limits",
          description: "Weekly limit should be greater than or equal to daily limit.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      await updateTimeLimits(daily, weekly)
      setHasChanges(false)

      const messages: string[] = []
      if (daily) messages.push(`Daily: ${minutesToHoursMinutes(daily)}`)
      if (weekly) messages.push(`Weekly: ${minutesToHoursMinutes(weekly)}`)

      toast({
        title: daily || weekly ? "Time limits updated" : "Time limits removed",
        description: messages.length > 0
          ? messages.join(" | ")
          : "You now have no watch time limits.",
      })
    } catch {
      toast({
        title: "Failed to update limits",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const dailyPreview = dailyLimit && !isNaN(parseInt(dailyLimit, 10))
    ? minutesToHoursMinutes(parseInt(dailyLimit, 10))
    : null

  const weeklyPreview = weeklyLimit && !isNaN(parseInt(weeklyLimit, 10))
    ? minutesToHoursMinutes(parseInt(weeklyLimit, 10))
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mt-1">
          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Watch time limits</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set daily and weekly limits to manage your screen time. You&apos;ll get a warning at 80% and a notification when you reach your limit.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Daily limit */}
        <div className="space-y-2">
          <label htmlFor="daily-limit" className="text-sm font-medium">
            Daily limit (minutes)
          </label>
          <div className="relative">
            <Input
              id="daily-limit"
              type="number"
              min="1"
              placeholder="e.g., 120"
              value={dailyLimit}
              onChange={(e) => handleDailyChange(e.target.value)}
              className="pr-8"
            />
            {dailyLimit && (
              <button
                type="button"
                onClick={clearDaily}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear daily limit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {dailyPreview && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              = {dailyPreview} per day
            </p>
          )}
        </div>

        {/* Weekly limit */}
        <div className="space-y-2">
          <label htmlFor="weekly-limit" className="text-sm font-medium">
            Weekly limit (minutes)
          </label>
          <div className="relative">
            <Input
              id="weekly-limit"
              type="number"
              min="1"
              placeholder="e.g., 600"
              value={weeklyLimit}
              onChange={(e) => handleWeeklyChange(e.target.value)}
              className="pr-8"
            />
            {weeklyLimit && (
              <button
                type="button"
                onClick={clearWeekly}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear weekly limit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {weeklyPreview && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              = {weeklyPreview} per week
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          size="sm"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save limits
        </Button>
      </div>
    </div>
  )
}
