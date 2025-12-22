"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { usePlayer } from "@/contexts/PlayerContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RefreshCw, AlertCircle } from "lucide-react"
import {
  useYouTubePlayer,
  buildYouTubeEmbedUrl,
  YouTubePlayerState,
} from "@/hooks/useYouTubePlayer"

// Extended type for screen orientation with optional lock method
interface OrientationWithLock {
  lock?: (orientation: "landscape" | "portrait" | "landscape-primary" | "landscape-secondary" | "portrait-primary" | "portrait-secondary") => Promise<void>
  unlock?: () => void
  type?: string
}

interface PlayerProps {
  videoId: string
  onWatched?: () => void
  initialTime?: number
}

// Validate YouTube video ID format (11 alphanumeric characters)
function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

export function Player({ videoId, onWatched, initialTime = 0 }: PlayerProps) {
  const [hasError, setHasError] = useState(false)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialTimeAppliedRef = useRef(false)

  const {
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setYouTubePlayerControls,
  } = usePlayer()

  // Handle player state changes
  const handleStateChange = useCallback((state: number) => {
    if (state === YouTubePlayerState.PLAYING) {
      setIsPlaying(true)
    } else if (state === YouTubePlayerState.PAUSED) {
      setIsPlaying(false)
    } else if (state === YouTubePlayerState.ENDED) {
      setIsPlaying(false)
      onWatched?.()
    }
  }, [setIsPlaying, onWatched])

  // Handle error event
  const handleError = useCallback((errorCode: number) => {
    console.error("YouTube Player Error:", errorCode)
    setHasError(true)
  }, [])

  // Handle time updates
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [setCurrentTime])

  // Use the custom YouTube player hook
  const {
    iframeRef,
    isReady,
    duration: playerDuration,
    playerState,
    controls,
  } = useYouTubePlayer({
    videoId,
    autoplay: false,
    initialTime,
    onStateChange: handleStateChange,
    onError: handleError,
    onTimeUpdate: handleTimeUpdate,
  })

  // Apply initial time when ready (handled in hook, but we also apply here as backup)
  useEffect(() => {
    if (isReady && initialTime > 0 && !initialTimeAppliedRef.current) {
      initialTimeAppliedRef.current = true
      controls.seekTo(initialTime, true)
      setCurrentTime(initialTime)
    }
  }, [isReady, initialTime, controls, setCurrentTime])

  // Update duration when available
  useEffect(() => {
    if (playerDuration > 0) {
      setDuration(playerDuration)
    }
  }, [playerDuration, setDuration])

  // Expose player controls to context
  useEffect(() => {
    if (isReady) {
      setYouTubePlayerControls(controls)
    }

    return () => {
      setYouTubePlayerControls(null)
    }
  }, [isReady, controls, setYouTubePlayerControls])

  // Set up interval to update current time (backup for infoDelivery)
  useEffect(() => {
    if (playerState === YouTubePlayerState.PLAYING) {
      // Start time update interval as backup
      if (!timeUpdateIntervalRef.current) {
        timeUpdateIntervalRef.current = setInterval(() => {
          const time = controls.getCurrentTime()
          if (time > 0) {
            setCurrentTime(time)
          }
        }, 1000)
      }
    } else {
      // Clear interval when not playing
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
    }
  }, [playerState, controls, setCurrentTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
      setYouTubePlayerControls(null)
    }
  }, [setYouTubePlayerControls])

  // Reset initialTimeApplied when video changes
  useEffect(() => {
    initialTimeAppliedRef.current = false
  }, [videoId])

  // Handle fullscreen changes to unlock/lock orientation for mobile
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      const orientation = screen.orientation as OrientationWithLock | undefined

      if (isFullscreen) {
        // Try to unlock orientation when entering fullscreen
        if (orientation?.unlock) {
          try {
            orientation.unlock()
          } catch {
            // Orientation API not supported or failed
          }
        }
        // Also try to lock to landscape for better video experience
        if (orientation?.lock) {
          orientation.lock("landscape").catch(() => {
            // Lock not supported, that's ok - at least we unlocked
          })
        }
      } else {
        // When exiting fullscreen, unlock to allow any orientation
        if (orientation?.unlock) {
          try {
            orientation.unlock()
          } catch {
            // Orientation API not supported
          }
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Validate video ID to prevent injection
  if (!isValidVideoId(videoId)) {
    return (
      <div
        className="relative aspect-video w-full flex items-center justify-center bg-[var(--muted)] rounded-xl"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center space-y-2 p-6">
          <AlertCircle className="w-8 h-8 mx-auto text-[var(--muted-foreground)]" aria-hidden="true" />
          <p className="text-[var(--muted-foreground)] font-medium">Invalid video ID</p>
          <p className="text-sm text-[var(--muted-foreground)] opacity-70">
            The video could not be loaded
          </p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        className="relative aspect-video w-full flex items-center justify-center bg-[var(--muted)] rounded-xl"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center space-y-4 p-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-[var(--foreground)] font-medium">Failed to load video</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Please check your connection and try again
            </p>
          </div>
          <Button
            onClick={() => {
              setHasError(false)
              initialTimeAppliedRef.current = false
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // Build the embed URL
  const embedUrl = buildYouTubeEmbedUrl(videoId, {
    autoplay: false,
    origin: typeof window !== "undefined" ? window.location.origin : "",
  })

  return (
    <div className="relative aspect-video w-full">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`YouTube video player - ${videoId}`}
      />
      {/* Loading overlay - Clear feedback for TDA users */}
      {!isReady && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center",
            "bg-[var(--muted)] rounded-xl pointer-events-none"
          )}
          role="status"
          aria-live="polite"
        >
          {/* Skeleton loader animation */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[var(--secondary)] animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="mt-4 text-[var(--muted-foreground)] font-medium">
            Loading video...
          </p>
          <p className="text-sm text-[var(--muted-foreground)] opacity-70 mt-1">
            This should only take a moment
          </p>
        </div>
      )}
    </div>
  )
}
