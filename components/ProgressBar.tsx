"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number // Progress in seconds
  duration: number | null | undefined // Total duration in seconds
  completed?: boolean
  showPercentage?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

function calculatePercentage(progress: number, duration: number | null | undefined): number {
  if (!duration || duration <= 0 || progress <= 0) return 0
  return Math.min(100, Math.round((progress / duration) * 100))
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

const sizeClasses = {
  sm: "h-0.5",
  md: "h-1",
  lg: "h-1.5",
}

export function ProgressBar({
  progress,
  duration,
  completed = false,
  showPercentage = false,
  className,
  size = "md",
}: ProgressBarProps) {
  const percentage = calculatePercentage(progress, duration)

  // Don't show if no progress
  if (percentage === 0 && !completed) {
    return null
  }

  // Determine color based on progress - use calming colors for TDA users
  // Blue for in-progress (neutral, calming), green for completed (positive)
  // Avoid red as it creates anxiety/urgency for TDA users
  const progressColor = completed
    ? "bg-success"
    : "bg-primary"

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-[var(--secondary)] rounded-full overflow-hidden",
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={completed ? "Completed" : `${percentage}% watched`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            progressColor
          )}
          style={{ width: `${completed ? 100 : percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between mt-1 text-xs text-[var(--muted-foreground)]">
          <time>{formatTime(progress)}</time>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  )
}

// Variant for use in video cards - absolute positioned at bottom
interface VideoCardProgressProps {
  progress: number | null | undefined
  duration: number | null | undefined
  completed?: boolean
}

export function VideoCardProgress({
  progress,
  duration,
  completed = false,
}: VideoCardProgressProps) {
  const percentage = calculatePercentage(progress || 0, duration)

  // Show completed state
  if (completed) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--secondary)]"
        role="progressbar"
        aria-valuenow={100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Completed"
      >
        <div className="h-full bg-success w-full" />
      </div>
    )
  }

  // Don't show if no progress
  if (!progress || progress <= 0 || percentage === 0) {
    return null
  }

  // Use blue for in-progress - calming color for TDA users
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--secondary)]"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% watched`}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Inline progress indicator with text
interface InlineProgressProps {
  progress: number | null | undefined
  duration: number | null | undefined
  completed?: boolean
}

export function InlineProgress({
  progress,
  duration,
  completed = false,
}: InlineProgressProps) {
  if (completed) {
    return (
      <span
        className="text-xs text-success flex items-center gap-1.5 font-medium"
        role="status"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Completed
      </span>
    )
  }

  if (!progress || progress <= 0 || !duration || duration <= 0) {
    return null
  }

  const percentage = calculatePercentage(progress, duration)
  const formattedTime = formatTime(progress)

  return (
    <span
      className="text-xs text-primary font-medium"
      role="status"
    >
      Continue from {formattedTime} ({percentage}%)
    </span>
  )
}
