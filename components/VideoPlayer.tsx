"use client"

import { Player } from "./Player"
import { WatchedButton } from "./WatchedButton"
import { WatchLaterButton } from "./WatchLaterButton"
import { LikeDislikeButton } from "./LikeDislikeButton"
import { AddToPlaylistButton } from "./AddToPlaylistButton"
import { AudioModePlayer } from "./AudioModePlayer"
import { AudioModeToggle } from "./AudioModeToggle"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import type { ReactionType } from "@/actions/reactions"
import { addToHistory } from "@/actions/history"
import { usePlayer } from "@/contexts/PlayerContext"
import { Button } from "@/components/ui/button"
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
  const addedToHistory = useRef(false)
  const { isAudioMode, toggleAudioMode } = usePlayer()

  // Add to history when video is opened
  useEffect(() => {
    if (addedToHistory.current) return
    addedToHistory.current = true

    addToHistory(videoId, {
      title: video.title,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelName: video.channelName,
      duration: video.duration
    })
  }, [videoId, video])

  return (
    <div className="space-y-6">
      {/* Video player */}
      <div className="rounded-xl overflow-hidden bg-black">
        {isAudioMode ? (
          <AudioModePlayer onSwitchToVideo={toggleAudioMode} />
        ) : (
          <Player
            videoId={videoId}
            onWatched={() => setIsWatched(true)}
          />
        )}
      </div>

      {/* Video info section */}
      <div className="space-y-4">
        {/* Title */}
        <h1 className="text-xl md:text-2xl font-bold leading-tight">
          {video.title}
        </h1>

        {/* Channel and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Channel link */}
          <Link
            href={`/subscription/${video.channelId}`}
            className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span className="font-medium">{video.channelName}</span>
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </Link>

          {/* Action buttons - Responsive grid */}
          <div className="flex flex-wrap items-center gap-2">
            <LikeDislikeButton videoId={videoId} initialReaction={initialReaction} />
            <AddToPlaylistButton video={video} />
            <WatchLaterButton video={video} isInWatchLater={initialInWatchLater} />
            <WatchedButton videoId={videoId} isWatched={isWatched} />
          </div>
        </div>

        <Separator />

        {/* Audio Mode Toggle */}
        <AudioModeToggle videoId={videoId} video={video} />
      </div>
    </div>
  )
}
