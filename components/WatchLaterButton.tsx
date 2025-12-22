"use client"

import { toggleWatchLater } from "@/actions/watch-later"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Clock, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface WatchLaterButtonProps {
  video: {
    videoId: string
    title: string
    thumbnail: string
    channelId: string
    channelName: string
  }
  isInWatchLater: boolean
  variant?: "icon" | "button"
}

export function WatchLaterButton({ video, isInWatchLater: initial, variant = "button" }: WatchLaterButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isInWatchLater, setIsInWatchLater] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)
    const previousState = isInWatchLater
    setIsInWatchLater(!isInWatchLater)

    try {
      const newState = await toggleWatchLater(video)
      setIsInWatchLater(newState)
      toast({
        title: newState ? "Added to Watch Later" : "Removed from Watch Later",
        description: newState
          ? "You can find this video in your Watch Later list."
          : "This video has been removed from Watch Later.",
      })
      router.refresh()
    } catch {
      setIsInWatchLater(previousState)
      toast({
        title: "Error",
        description: "Failed to update Watch Later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`p-2 rounded-full transition-all duration-150 ${
              isInWatchLater
                ? "bg-blue-600 text-white"
                : "bg-black/50 text-white hover:bg-black/70"
            } disabled:opacity-50`}
            aria-label={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInWatchLater ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleToggle}
          disabled={loading}
          variant={isInWatchLater ? "default" : "secondary"}
          size="sm"
          aria-label={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Clock className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {loading ? "..." : isInWatchLater ? "Saved" : "Watch Later"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
      </TooltipContent>
    </Tooltip>
  )
}
