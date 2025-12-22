"use client"

import { useState } from "react"
import { setReaction, type ReactionType } from "@/actions/reactions"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface LikeDislikeButtonProps {
  videoId: string
  initialReaction: ReactionType | null
}

export function LikeDislikeButton({ videoId, initialReaction }: LikeDislikeButtonProps) {
  const { toast } = useToast()
  const [reaction, setReactionState] = useState<ReactionType | null>(initialReaction)
  const [loading, setLoading] = useState<"like" | "dislike" | null>(null)

  async function handleClick(type: ReactionType) {
    setLoading(type)
    const previousReaction = reaction

    // Optimistic update
    if (reaction === type) {
      setReactionState(null)
    } else {
      setReactionState(type)
    }

    try {
      await setReaction(videoId, type)

      // Show feedback
      if (previousReaction === type) {
        toast({ title: "Reaction removed" })
      } else if (type === "like") {
        toast({ title: "Liked", description: "Added to your liked videos." })
      } else {
        toast({ title: "Disliked", description: "This video won't be recommended." })
      }
    } catch {
      // Revert on error
      setReactionState(previousReaction)
      toast({
        title: "Error",
        description: "Failed to save reaction.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => handleClick("like")}
            disabled={loading !== null}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none border-r border-gray-200 dark:border-gray-700",
              reaction === "like" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            )}
            aria-label={reaction === "like" ? "Remove like" : "Like this video"}
            aria-pressed={reaction === "like"}
          >
            {loading === "like" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ThumbsUp
                className={cn("h-4 w-4", reaction === "like" && "fill-current")}
                aria-hidden="true"
              />
            )}
            <span className="hidden sm:inline ml-1">Like</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Like</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => handleClick("dislike")}
            disabled={loading !== null}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none",
              reaction === "dislike" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}
            aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike this video"}
            aria-pressed={reaction === "dislike"}
          >
            {loading === "dislike" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ThumbsDown
                className={cn("h-4 w-4", reaction === "dislike" && "fill-current")}
                aria-hidden="true"
              />
            )}
            <span className="hidden sm:inline ml-1">Dislike</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Dislike</TooltipContent>
      </Tooltip>
    </div>
  )
}
