"use client"

import { useState } from "react"
import { updateSyncInterval } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SyncIntervalSettingsProps {
  initialInterval: 3 | 6 | 12 | 24
}

const intervals = [
  { hours: 3, label: "3h" },
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
] as const

export function SyncIntervalSettings({
  initialInterval,
}: SyncIntervalSettingsProps) {
  const { toast } = useToast()
  const [interval, setInterval] = useState<3 | 6 | 12 | 24>(initialInterval)
  const [loading, setLoading] = useState(false)

  async function handleIntervalChange(newInterval: 3 | 6 | 12 | 24) {
    if (newInterval === interval) return

    setLoading(true)
    const previousInterval = interval
    setInterval(newInterval)

    try {
      await updateSyncInterval(newInterval)
      toast({
        title: "Sync interval updated",
        description: `Auto-sync will now run every ${newInterval} hours.`,
      })
    } catch {
      setInterval(previousInterval)
      toast({
        title: "Failed to update interval",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium">Auto-sync interval</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How often to fetch new videos
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden="true" />
        )}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          {intervals.map((opt) => (
            <Button
              key={opt.hours}
              variant="ghost"
              size="sm"
              onClick={() => handleIntervalChange(opt.hours)}
              disabled={loading}
              className={cn(
                "px-3 py-1 h-8 rounded-md transition-colors",
                interval === opt.hours
                  ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              aria-pressed={interval === opt.hours}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
