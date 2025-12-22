"use client"

import Link from "next/link"
import { ThumbsUp, StickyNote, Eye, Clock, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VideoCardProgress } from "./ProgressBar"

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
  // Progress tracking props
  progress?: number | null
  completed?: boolean
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

function formatProgressTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
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
  reaction,
  progress,
  completed,
}: VideoCardProps) {
  const timeAgo = getTimeAgo(publishedAt)
  const hasProgress = (progress && progress > 0) || completed

  return (
    <Link
      href={`/watch/${videoId}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
      aria-label={`Watch ${title} by ${channelName}, published ${timeAgo}${isWatched ? ", already watched" : ""}${completed ? ", completed" : hasProgress ? `, ${Math.round(((progress || 0) / (duration || 1)) * 100)}% watched` : ""}`}
    >
      <article className="space-y-3">
        {/* Thumbnail container */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-[var(--muted)]">
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            className={cn(
              "w-full h-full object-cover transition-all duration-200",
              "group-hover:scale-[1.02]",
              (isWatched || completed) && "opacity-70"
            )}
          />

          {/* Watched/Completed overlay */}
          {(isWatched || completed) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Badge
                variant="secondary"
                className="bg-black/70 text-white border-0 gap-1"
              >
                {completed ? (
                  <>
                    <CheckCircle className="h-3 w-3" aria-hidden="true" />
                    Completed
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    Watched
                  </>
                )}
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

          {/* Progress bar - at the very bottom */}
          <VideoCardProgress
            progress={progress}
            duration={duration}
            completed={completed}
          />

          {/* Hover overlay for better interactivity feedback */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
        </div>

        {/* Video info - Clear hierarchy for TDA users */}
        <div className="space-y-1.5 px-1">
          <h3 className="font-medium leading-snug line-clamp-2 text-[var(--foreground)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] truncate">
            {channelName}
          </p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <time dateTime={publishedAt}>{timeAgo}</time>
            {/* Show continue from time if there's progress but not completed */}
            {hasProgress && !completed && progress && duration && (
              <>
                <span aria-hidden="true" className="text-[var(--border)]">|</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Continue from {formatProgressTime(progress)}
                </span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

// Skeleton for loading state - Matches VideoCard structure
export function VideoCardSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Loading video..."
    >
      {/* Thumbnail skeleton */}
      <div className="aspect-video rounded-xl bg-[var(--secondary)] animate-pulse" />
      {/* Text content skeleton */}
      <div className="space-y-2 px-1">
        <div className="h-4 bg-[var(--secondary)] rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-[var(--secondary)] rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-[var(--secondary)] rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-[var(--secondary)] rounded animate-pulse" />
      </div>
      <span className="sr-only">Loading video content...</span>
    </div>
  )
}
