"use client"

import { useState, useEffect } from "react"
import { getAudioUrl, isAudioModeAvailable } from "@/actions/audio"
import { usePlayer } from "@/contexts/PlayerContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Volume2, Loader2, Video } from "lucide-react"
import { AudioDownloadStatus } from "./AudioDownloadStatus"

interface AudioModeToggleProps {
  videoId: string
  video: {
    title: string
    channelName: string
    thumbnail: string
    duration?: number | null
  }
  currentVideoTime?: number // Current time from video player for sync
}

export function AudioModeToggle({ videoId, video, currentVideoTime = 0 }: AudioModeToggleProps) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    isAudioMode,
    toggleAudioMode,
    playVideo,
    setAudioUrl,
    seek,
    currentTime,
    youtubePlayerControls,
  } = usePlayer()

  useEffect(() => {
    isAudioModeAvailable().then(setIsAvailable)
  }, [])

  const handleToggle = async () => {
    setError(null)

    if (isAudioMode) {
      // Switching from audio to video mode
      // The video player will handle syncing via the currentTime from context
      toggleAudioMode()
      return
    }

    // Switching from video to audio mode
    setIsLoading(true)
    try {
      // Get current time from YouTube player if available
      let syncTime = currentVideoTime
      if (youtubePlayerControls) {
        try {
          syncTime = youtubePlayerControls.getCurrentTime() || currentVideoTime
        } catch {
          // Player might not be ready, use fallback
        }
      }

      const audioUrl = await getAudioUrl(videoId)

      if (audioUrl) {
        setAudioUrl(audioUrl)
        playVideo({
          videoId,
          title: video.title,
          channelName: video.channelName,
          thumbnail: video.thumbnail,
          duration: video.duration,
        })
        toggleAudioMode()

        // Sync to current video time after a short delay to let audio load
        if (syncTime > 0) {
          setTimeout(() => {
            seek(syncTime)
          }, 500)
        }
      } else {
        setError("Audio mode is not available. Please ensure yt-dlp is configured on the server.")
      }
    } catch (err) {
      console.error("Error activating audio mode:", err)
      setError("Failed to activate audio mode. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if backend not configured
  if (!isAvailable) {
    return null
  }

  return (
    <div
      className={cn(
        "bg-[var(--muted)] rounded-xl p-4",
        "ring-1 ring-[var(--border)]",
        isAudioMode && "ring-2 ring-blue-500/50 bg-blue-50 dark:bg-blue-950/30"
      )}
      role="region"
      aria-label="Audio mode controls"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side - Icon and description */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl transition-colors",
            isAudioMode
              ? "bg-blue-600 text-white"
              : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
          )}>
            <Volume2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-medium text-sm text-[var(--foreground)]">
              Audio Only Mode
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {isAudioMode
                ? "Currently playing audio only"
                : "Listen in the background and save data"}
            </p>
          </div>
        </div>

        {/* Right side - Toggle button */}
        <Button
          onClick={handleToggle}
          disabled={isLoading}
          variant={isAudioMode ? "default" : "secondary"}
          className={cn(
            "gap-2 min-w-[140px]",
            isAudioMode && "bg-blue-600 hover:bg-blue-700"
          )}
          aria-pressed={isAudioMode}
          aria-describedby="audio-mode-description"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Loading...</span>
            </>
          ) : isAudioMode ? (
            <>
              <Video className="w-4 h-4" aria-hidden="true" />
              <span>Switch to Video</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>Enable Audio</span>
            </>
          )}
        </Button>
      </div>

      {/* Hidden description for screen readers */}
      <span id="audio-mode-description" className="sr-only">
        {isAudioMode
          ? "Audio mode is enabled. Click to switch back to video mode."
          : "Click to enable audio-only mode. Audio will continue playing in the background."}
      </span>

      {/* Error message - Clear feedback for users */}
      {error && (
        <div
          className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium">Unable to load audio</p>
          <p className="text-xs mt-1 opacity-80">{error}</p>
        </div>
      )}

      {/* Status info when in audio mode */}
      {isAudioMode && (
        <div
          className="mt-3 flex items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <AudioDownloadStatus videoId={videoId} />
          {currentTime > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
              Playing from {formatTime(currentTime)}
            </div>
          )}
        </div>
      )}
    </div>
  )
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
