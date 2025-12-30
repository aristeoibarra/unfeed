"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { usePlayer } from "@/contexts/PlayerContext"
import { useToast } from "@/components/ui/use-toast"
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

function getMediaErrorMessage(code: number): string {
  switch (code) {
    case 1: return "MEDIA_ERR_ABORTED - Fetch aborted"
    case 2: return "MEDIA_ERR_NETWORK - Network error"
    case 3: return "MEDIA_ERR_DECODE - Decode error"
    case 4: return "MEDIA_ERR_SRC_NOT_SUPPORTED - Source not supported"
    default: return `Unknown error code: ${code}`
  }
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

  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Loading audio...")
  const progressRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLoadingToast = useRef(false)

  // Handle loading state - check if audio is ready to play
  /* eslint-disable react-hooks/set-state-in-effect -- Intentional: sync loading state with audio element */
  useEffect(() => {
    const audio = audioRef.current

    // If no audio element or no URL, we're still loading
    if (!audio || !audioUrl) {
      setIsLoading(true)
      setLoadingMessage("Fetching audio stream...")

      // Show loading toast after 2 seconds if still loading
      if (!hasShownLoadingToast.current) {
        timeoutRef.current = setTimeout(() => {
          if (!audioUrl) {
            hasShownLoadingToast.current = true
            toast({
              title: "Loading audio...",
              description: "Extracting audio stream from video. This may take a moment.",
            })
          }
        }, 2000)
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }

    // Clear timeout when we have audioUrl
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setLoadingMessage("Buffering audio...")

    const handleCanPlay = () => {
      setIsLoading(false)
      setHasError(false)
    }
    const handleCanPlayThrough = () => {
      setIsLoading(false)
      setHasError(false)
    }
    const handleWaiting = () => {
      setIsLoading(true)
      setLoadingMessage("Buffering...")
    }
    const handlePlaying = () => {
      setIsLoading(false)
      setHasError(false)
    }
    const handleLoadedData = () => {
      setIsLoading(false)
      setHasError(false)
    }
    const handleError = (e: Event) => {
      setIsLoading(false)
      setHasError(true)
      const audioEl = e.target as HTMLAudioElement
      const error = audioEl?.error
      const errorMessage = error
        ? `Code ${error.code}: ${error.message || getMediaErrorMessage(error.code)}`
        : "Unknown error"
      toast({
        title: "Audio error",
        description: errorMessage,
        variant: "destructive",
      })
    }

    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("canplaythrough", handleCanPlayThrough)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("playing", handlePlaying)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("error", handleError)

    // Check if audio is already ready
    if (audio.readyState >= 2 && audio.src) {
      setIsLoading(false)
    }

    // Timeout for audio loading (15 seconds)
    const loadTimeout = setTimeout(() => {
      if (isLoading && !audio.readyState) {
        setHasError(true)
        toast({
          title: "Audio loading timeout",
          description: "Audio is taking too long to load. Try switching to video mode.",
          variant: "destructive",
        })
      }
    }, 15000)

    return () => {
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("canplaythrough", handleCanPlayThrough)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("playing", handlePlaying)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("error", handleError)
      clearTimeout(loadTimeout)
    }
  }, [audioRef, audioUrl, toast, isLoading])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset toast flag when audioUrl changes
  useEffect(() => {
    hasShownLoadingToast.current = false
  }, [currentVideo?.videoId])

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
    <div className="bg-card dark:bg-gradient-to-b dark:from-[var(--background-alt)] dark:to-[var(--background)] rounded-xl p-6 md:p-8">
      <div className="flex flex-col items-center space-y-6">
        {/* Header - Clear visual indicator for audio mode */}
        <div
          className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full"
          role="status"
          aria-live="polite"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium text-sm">Audio Only Mode</span>
        </div>

        {/* Thumbnail - Larger on desktop for better visual hierarchy */}
        <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-xl overflow-hidden shadow-lg ring-1 ring-[var(--border)]">
          <Image
            src={currentVideo.thumbnail}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 160px, 224px"
          />
          {(isLoading || hasError) && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              {hasError ? (
                <span className="text-destructive text-xs font-medium">Error</span>
              ) : (
                <>
                  <div
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
                    role="status"
                    aria-label="Loading audio"
                  />
                  <span className="text-white/80 text-xs">{loadingMessage}</span>
                </>
              )}
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
              className="h-full bg-primary rounded-full transition-all duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Scrubber dot - Always visible for better affordance */}
              <div className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-background rounded-full shadow-md",
                "ring-2 ring-primary",
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
              "bg-primary hover:opacity-90 text-primary-foreground",
              "focus-visible:ring-4 focus-visible:ring-primary/50",
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
