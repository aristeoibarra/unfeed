"use client"

import { useState } from "react"
import { updateSettings } from "@/actions/settings"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ThumbsDown, Loader2 } from "lucide-react"

interface SettingsToggleProps {
  initialHideDisliked: boolean
}

export function SettingsToggle({ initialHideDisliked }: SettingsToggleProps) {
  const { toast } = useToast()
  const [hideDisliked, setHideDisliked] = useState(initialHideDisliked)
  const [loading, setLoading] = useState(false)

  async function handleToggle(checked: boolean) {
    setLoading(true)
    setHideDisliked(checked)

    try {
      await updateSettings({ hideDislikedFromFeed: checked })
      toast({
        title: checked ? "Disliked videos hidden" : "Disliked videos shown",
        description: checked
          ? "Videos you dislike will no longer appear in your feed."
          : "Disliked videos will now appear in your feed.",
      })
    } catch {
      // Revert on error
      setHideDisliked(!checked)
      toast({
        title: "Failed to update settings",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-destructive/10 rounded-lg shrink-0">
          <ThumbsDown className="h-5 w-5 text-destructive" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="hide-disliked"
            className="font-medium cursor-pointer"
          >
            Hide disliked videos
          </label>
          <p className="text-sm text-muted-foreground">
            Videos you dislike will be hidden from your feed
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        <Switch
          id="hide-disliked"
          checked={hideDisliked}
          onCheckedChange={handleToggle}
          disabled={loading}
          aria-describedby="hide-disliked-desc"
        />
      </div>
    </div>
  )
}
