"use client"

import { useState, useEffect, useRef } from "react"
import { usePlayer } from "@/contexts/PlayerContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Video,
  Volume2,
} from "lucide-react"

interface AudioModePlayerProps {
  onSwitchToVideo: () => void
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AudioModePlayer({ onSwitchToVideo }: AudioModePlayerProps) {
  const {
    currentVideo,
    isPlaying,
    audioRef,
    audioUrl,
    pause,
    resume,
    seek,
    setCurrentTime,
    currentTime,
    duration,
  } = usePlayer()

  const [isLoading, setIsLoading] = useState(true)
  const progressRef = useRef<HTMLDivElement>(null)

  // Handle loading state - check if audio is ready to play
  useEffect(() => {
    const audio = audioRef.current

    // If no audio element or no URL, we're still loading
    if (!audio || !audioUrl) {
      setIsLoading(true)
      return
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleCanPlayThrough = () => {
      setIsLoading(false)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("canplaythrough", handleCanPlayThrough)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("playing", handlePlaying)
    audio.addEventListener("loadeddata", handleLoadedData)

    // Check if audio is already ready
    // readyState: 0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA
    if (audio.readyState >= 2) {
      setIsLoading(false)
    }

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("canplaythrough", handleCanPlayThrough)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("playing", handlePlaying)
      audio.removeEventListener("loadeddata", handleLoadedData)
    }
  }, [audioRef, audioUrl])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    seek(newTime)
  }

  const handleSeekBackward = () => {
    seek(Math.max(0, currentTime - 10))
  }

  const handleSeekForward = () => {
    seek(Math.min(duration, currentTime + 10))
  }

  const handleSwitchToVideo = () => {
    // Get current audio time to sync with video
    const currentAudioTime = audioRef.current?.currentTime || currentTime

    // Pause audio before switching
    if (audioRef.current) {
      audioRef.current.pause()
    }

    // Update context with current time so video can pick it up
    setCurrentTime(currentAudioTime)

    // Call the switch handler
    onSwitchToVideo()
  }

  if (!currentVideo) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasAudioSource = !!audioUrl

  return (
    <div className="bg-[var(--card)] dark:bg-gradient-to-b dark:from-[#1a1a1a] dark:to-[#0f0f0f] rounded-xl p-6 md:p-8">
      <div className="flex flex-col items-center space-y-6">
        {/* Header - Clear visual indicator for audio mode */}
        <div
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-4 py-2 rounded-full"
          role="status"
          aria-live="polite"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium text-sm">Audio Only Mode</span>
        </div>

        {/* Thumbnail - Larger on desktop for better visual hierarchy */}
        <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-lg ring-1 ring-[var(--border)]">
          <img
            src={currentVideo.thumbnail}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Loading audio"
              />
            </div>
          )}
        </div>

        {/* Title & Channel - Clear hierarchy for TDA users */}
        <div className="text-center max-w-md space-y-1">
          <h2 className="font-semibold text-[var(--foreground)] line-clamp-2 text-lg">
            {currentVideo.title}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {currentVideo.channelName}
          </p>
        </div>

        {/* Progress bar - Larger click area for better accessibility */}
        <div className="w-full max-w-md" role="group" aria-label="Audio progress">
          <div
            ref={progressRef}
            className={cn(
              "h-3 md:h-2 bg-[var(--secondary)] rounded-full cursor-pointer group",
              "hover:h-4 transition-all duration-150"
            )}
            onClick={handleProgressClick}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                handleSeekBackward()
              } else if (e.key === 'ArrowRight') {
                handleSeekForward()
              }
            }}
            tabIndex={0}
            role="slider"
            aria-label="Seek audio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          >
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Scrubber dot - Always visible for better affordance */}
              <div className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md",
                "ring-2 ring-blue-600 dark:ring-blue-500",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100 transition-opacity"
              )} />
            </div>
          </div>
          {/* Time display - Clear labels */}
          <div className="flex justify-between text-sm text-[var(--muted-foreground)] mt-2 font-mono">
            <time aria-label="Current time">{formatTime(currentTime)}</time>
            <time aria-label="Total duration">{formatTime(duration)}</time>
          </div>
        </div>

        {/* Controls - Large touch targets (min 44px) */}
        <div className="flex items-center gap-4 md:gap-6" role="group" aria-label="Playback controls">
          {/* Seek backward 10s */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSeekBackward}
            className="h-12 w-12 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            aria-label="Seek backward 10 seconds"
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          {/* Play/Pause - Primary action, most prominent */}
          <Button
            onClick={isPlaying ? pause : resume}
            disabled={isLoading && !hasAudioSource}
            className={cn(
              "h-16 w-16 rounded-full shadow-lg",
              "bg-blue-600 hover:bg-blue-700 text-white",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>

          {/* Seek forward 10s */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSeekForward}
            className="h-12 w-12 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
            aria-label="Seek forward 10 seconds"
          >
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>

        {/* Switch to video button - Secondary action */}
        <Button
          variant="outline"
          onClick={handleSwitchToVideo}
          className="gap-2"
        >
          <Video className="w-4 h-4" aria-hidden="true" />
          Switch to video
        </Button>

        {/* Info message - Helpful context for users */}
        <p className="text-xs text-[var(--muted-foreground)] text-center max-w-sm bg-[var(--muted)] px-4 py-2 rounded-lg">
          Audio will continue playing even if you turn off the screen or switch apps.
        </p>
      </div>

    </div>
  )
}
