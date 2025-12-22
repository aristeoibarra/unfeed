"use client"

import { Player } from "./Player"
import { WatchedButton } from "./WatchedButton"
import { WatchLaterButton } from "./WatchLaterButton"
import { LikeDislikeButton } from "./LikeDislikeButton"
import { AddToPlaylistButton } from "./AddToPlaylistButton"
import { AudioModePlayer } from "./AudioModePlayer"
import { AudioModeToggle } from "./AudioModeToggle"
import { ResumeDialogFull } from "./ResumeDialog"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { ReactionType } from "@/actions/reactions"
import { addToHistory, getVideoProgress } from "@/actions/history"
import { usePlayer } from "@/contexts/PlayerContext"
import { Separator } from "@/components/ui/separator"

interface Video {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  duration?: number | null
}

interface VideoPlayerProps {
  videoId: string
  video: Video
  initialWatched: boolean
  initialInWatchLater: boolean
  initialReaction: ReactionType | null
}

export function VideoPlayer({
  videoId,
  video,
  initialWatched,
  initialInWatchLater,
  initialReaction,
}: VideoPlayerProps) {
  const [isWatched, setIsWatched] = useState(initialWatched)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [savedProgress, setSavedProgress] = useState<number | null>(null)
  const [resumeTime, setResumeTime] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const addedToHistory = useRef(false)

  const {
    isAudioMode,
    toggleAudioMode,
    setHistoryId,
    currentTime,
    playVideo,
  } = usePlayer()

  // Check for saved progress and add to history
  useEffect(() => {
    if (addedToHistory.current) return
    addedToHistory.current = true

    const initializePlayer = async () => {
      // Check for existing progress
      const existingProgress = await getVideoProgress(videoId)

      if (existingProgress && !existingProgress.completed && existingProgress.progress > 30) {
        // Only show resume dialog if progress is more than 30 seconds
        // and video is not completed
        setSavedProgress(existingProgress.progress)
        setHistoryId(existingProgress.historyId)
        setShowResumeDialog(true)
      } else {
        // No significant progress, start fresh and create new history entry
        const historyId = await addToHistory(videoId, {
          title: video.title,
          thumbnail: video.thumbnail,
          channelId: video.channelId,
          channelName: video.channelName,
          duration: video.duration,
        })
        setHistoryId(historyId)
        setIsInitialized(true)
      }

      // Set up player context with video info
      playVideo({
        videoId,
        title: video.title,
        channelName: video.channelName,
        thumbnail: video.thumbnail,
        duration: video.duration,
      })
    }

    initializePlayer()
  }, [videoId, video, setHistoryId, playVideo])

  const handleResume = () => {
    if (savedProgress) {
      setResumeTime(savedProgress)
    }
    setIsInitialized(true)
  }

  const handleStartOver = async () => {
    // Create new history entry for fresh start
    const historyId = await addToHistory(videoId, {
      title: video.title,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelName: video.channelName,
      duration: video.duration,
    })
    setHistoryId(historyId)
    setResumeTime(0)
    setIsInitialized(true)
  }

  const handleSwitchToVideo = () => {
    // When switching from audio to video, maintain the current time
    setResumeTime(currentTime)
    toggleAudioMode()
  }

  return (
    <article className="space-y-6" aria-label={`Video: ${video.title}`}>
      {/* Resume Dialog */}
      <ResumeDialogFull
        isOpen={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
        onResume={handleResume}
        onStartOver={handleStartOver}
        progress={savedProgress || 0}
        duration={video.duration}
        videoTitle={video.title}
      />

      {/* Video player container */}
      <div className="rounded-xl overflow-hidden bg-[var(--card)] ring-1 ring-[var(--border)]">
        {isAudioMode ? (
          <AudioModePlayer onSwitchToVideo={handleSwitchToVideo} />
        ) : (
          isInitialized && (
            <Player
              videoId={videoId}
              onWatched={() => setIsWatched(true)}
              initialTime={resumeTime}
            />
          )
        )}
        {/* Loading state - Clear feedback for TDA users */}
        {!isInitialized && !showResumeDialog && (
          <div
            className="aspect-video flex flex-col items-center justify-center bg-[var(--muted)]"
            role="status"
            aria-live="polite"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary)] animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="mt-3 text-[var(--muted-foreground)] text-sm">
              Preparing video...
            </p>
          </div>
        )}
      </div>

      {/* Video info section - Clear visual hierarchy */}
      <div className="space-y-4">
        {/* Title - Most prominent element */}
        <h1 className="text-xl md:text-2xl font-bold leading-tight text-[var(--foreground)]">
          {video.title}
        </h1>

        {/* Channel and actions - Responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Channel link - Secondary importance */}
          <Link
            href={`/subscription/${video.channelId}`}
            className="group inline-flex items-center gap-2 text-[var(--muted-foreground)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-1 -mx-1"
          >
            <span className="font-medium">{video.channelName}</span>
            <ExternalLink
              className="h-4 w-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          </Link>

          {/* Action buttons - Consistent spacing, touch-friendly */}
          <nav
            className="flex flex-wrap items-center gap-2"
            aria-label="Video actions"
          >
            <LikeDislikeButton videoId={videoId} initialReaction={initialReaction} />
            <AddToPlaylistButton video={video} />
            <WatchLaterButton video={video} isInWatchLater={initialInWatchLater} />
            <WatchedButton videoId={videoId} isWatched={isWatched} />
          </nav>
        </div>

        <Separator className="my-4" />

        {/* Audio Mode Toggle - Clear section separation */}
        <AudioModeToggle
          videoId={videoId}
          video={video}
          currentVideoTime={currentTime}
        />
      </div>
    </article>
  )
}
