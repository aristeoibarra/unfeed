"use client"

import { Player } from "./Player"
import { WatchedButton } from "./WatchedButton"
import { WatchLaterButton } from "./WatchLaterButton"
import { useState } from "react"

interface Video {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
}

interface VideoPlayerProps {
  videoId: string
  video: Video
  initialWatched: boolean
  initialInWatchLater: boolean
}

export function VideoPlayer({
  videoId,
  video,
  initialWatched,
  initialInWatchLater,
}: VideoPlayerProps) {
  const [isWatched, setIsWatched] = useState(initialWatched)

  return (
    <>
      <Player
        videoId={videoId}
        onWatched={() => setIsWatched(true)}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{video.title}</h1>
          <a
            href={`/channel/${video.channelId}`}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {video.channelName}
          </a>
        </div>
        <div className="flex gap-2">
          <WatchLaterButton video={video} isInWatchLater={initialInWatchLater} />
          <WatchedButton videoId={videoId} isWatched={isWatched} />
        </div>
      </div>
    </>
  )
}
