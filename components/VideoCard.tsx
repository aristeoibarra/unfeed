"use client"

import Link from "next/link"
import { ThumbsUp, StickyNote, Eye, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ReactionType = "like" | "dislike" | null

interface VideoCardProps {
  videoId: string
  title: string
  thumbnail: string
  channelName: string
  channelId?: string
  publishedAt: string
  duration?: number | null
  isWatched?: boolean
  hasNote?: boolean
  reaction?: ReactionType
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }

  return "Just now"
}

export function VideoCard({
  videoId,
  title,
  thumbnail,
  channelName,
  publishedAt,
  duration,
  isWatched,
  hasNote,
  reaction
}: VideoCardProps) {
  const timeAgo = getTimeAgo(publishedAt)

  return (
    <Link
      href={`/watch/${videoId}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
      aria-label={`Watch ${title} by ${channelName}, published ${timeAgo}${isWatched ? ", already watched" : ""}`}
    >
      <article className="space-y-3">
        {/* Thumbnail container */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-all duration-200",
              "group-hover:scale-[1.02]",
              isWatched && "opacity-70"
            )}
          />

          {/* Watched overlay */}
          {isWatched && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Badge
                variant="secondary"
                className="bg-black/70 text-white border-0 gap-1"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                Watched
              </Badge>
            </div>
          )}

          {/* Status indicators - Top left */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {hasNote && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 bg-yellow-500 text-white rounded-lg shadow-sm">
                    <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Has notes</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Has notes</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Reaction indicator - Top right */}
          {reaction === "like" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Liked</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Liked</TooltipContent>
            </Tooltip>
          )}

          {/* Duration badge - Bottom right */}
          {duration != null && duration > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded-md">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <time dateTime={`PT${duration}S`}>{formatDuration(duration)}</time>
            </div>
          )}

          {/* Hover overlay for better interactivity feedback */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Video info */}
        <div className="space-y-1.5 px-1">
          <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {channelName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            <time dateTime={publishedAt}>{timeAgo}</time>
          </p>
        </div>
      </article>
    </Link>
  )
}

// Skeleton for loading state
export function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="space-y-2 px-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  )
}
