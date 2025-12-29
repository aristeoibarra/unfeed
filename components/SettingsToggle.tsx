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
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          <ThumbsDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
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
      <div className="flex items-center gap-2">
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
