"use client"

import { toggleWatched } from "@/actions/watched"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WatchedButtonProps {
  videoId: string
  isWatched: boolean
}

export function WatchedButton({ videoId, isWatched: initialWatched }: WatchedButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isWatched, setIsWatched] = useState(initialWatched)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    // Optimistic update
    const previousState = isWatched
    setIsWatched(!isWatched)

    try {
      const newState = await toggleWatched(videoId)
      setIsWatched(newState)
      toast({
        title: newState ? "Marked as watched" : "Marked as unwatched",
        description: newState
          ? "This video has been marked as watched."
          : "This video has been marked as unwatched.",
      })
      router.refresh()
    } catch {
      // Revert on error
      setIsWatched(previousState)
      toast({
        title: "Error",
        description: "Failed to update watched status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleToggle}
          disabled={loading}
          variant={isWatched ? "default" : "secondary"}
          size="sm"
          className={isWatched ? "bg-green-600 hover:bg-green-700" : ""}
          aria-label={isWatched ? "Mark as unwatched" : "Mark as watched"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isWatched ? (
            <Eye className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {loading ? "..." : isWatched ? "Watched" : "Mark watched"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isWatched ? "Mark as unwatched" : "Mark as watched"}
      </TooltipContent>
    </Tooltip>
  )
}
