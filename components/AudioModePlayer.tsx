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
    setDuration,
    setIsPlaying,
    currentTime: contextCurrentTime,
  } = usePlayer()

  const [localCurrentTime, setLocalCurrentTime] = useState(0)
  const [localDuration, setLocalDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const progressRef = useRef<HTMLDivElement>(null)
  const initialSeekDoneRef = useRef(false)

  // Sync local state with context
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setLocalCurrentTime(time)
      setCurrentTime(time)
    }

    const handleDurationChange = () => {
      const dur = audio.duration || 0
      setLocalDuration(dur)
      setDuration(dur)
    }

    const handleEnded = () => {
      pause()
      setIsPlaying(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)

      // Seek to context time if this is the first load and there's a saved position
      if (!initialSeekDoneRef.current && contextCurrentTime > 0) {
        initialSeekDoneRef.current = true
        audio.currentTime = contextCurrentTime
      }
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("playing", handlePlaying)

    // Initialize with current values
    if (audio.duration) {
      setLocalDuration(audio.duration)
      setDuration(audio.duration)
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("playing", handlePlaying)
    }
  }, [audioRef, pause, setCurrentTime, setDuration, setIsPlaying, contextCurrentTime])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !localDuration) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * localDuration
    seek(newTime)
  }

  const handleSeekBackward = () => {
    seek(Math.max(0, localCurrentTime - 10))
  }

  const handleSeekForward = () => {
    seek(Math.min(localDuration, localCurrentTime + 10))
  }

  const handleSwitchToVideo = () => {
    // Get current audio time to sync with video
    const currentAudioTime = audioRef.current?.currentTime || localCurrentTime

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

  const progress = localDuration > 0 ? (localCurrentTime / localDuration) * 100 : 0

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
            aria-valuetext={`${formatTime(localCurrentTime)} of ${formatTime(localDuration)}`}
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
            <time aria-label="Current time">{formatTime(localCurrentTime)}</time>
            <time aria-label="Total duration">{formatTime(localDuration)}</time>
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
            disabled={isLoading && !audioRef.current?.src}
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

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay={isPlaying}
          preload="auto"
        />
      )}
    </div>
  )
}
