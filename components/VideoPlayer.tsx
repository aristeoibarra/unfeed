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
import type { ReactionType } from "@/actions/reactions"
import { addToHistory } from "@/actions/history"
import { usePlayer } from "@/contexts/PlayerContext"

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
    <div className="space-y-4">
      {isAudioMode ? (
        <AudioModePlayer onSwitchToVideo={toggleAudioMode} />
      ) : (
        <Player
          videoId={videoId}
          onWatched={() => setIsWatched(true)}
        />
      )}

      <div className="space-y-3">
        <h1 className="text-xl font-bold">{video.title}</h1>

        <div className="flex items-center justify-between">
          <Link
            href={`/subscription/${video.channelId}`}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {video.channelName}
          </Link>

          <div className="flex gap-2">
            <LikeDislikeButton videoId={videoId} initialReaction={initialReaction} />
            <AddToPlaylistButton video={video} />
            <WatchLaterButton video={video} isInWatchLater={initialInWatchLater} />
            <WatchedButton videoId={videoId} isWatched={isWatched} />
          </div>
        </div>

        {/* Audio Mode Toggle */}
        <AudioModeToggle videoId={videoId} video={video} />
      </div>
    </div>
  )
}
