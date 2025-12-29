"use client"

import { useState } from "react"
import { VideoCard } from "./VideoCard"
import { loadMoreLikedVideos } from "@/actions/reactions"

interface VideoInfo {
  videoId: string
  title: string
  thumbnail: string
  channelId: string
  channelName: string
  publishedAt: string
  duration: number | null
}

interface LikedVideoFeedProps {
  initialVideos: VideoInfo[]
  initialHasMore: boolean
  watchedIds: Set<string>
  noteIds: Set<string>
}

export function LikedVideoFeed({
  initialVideos,
  initialHasMore,
  watchedIds,
  noteIds,
}: LikedVideoFeedProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleLoadMore() {
    setLoading(true)
    const nextPage = page + 1
    const result = await loadMoreLikedVideos(nextPage)

    setVideos([...videos, ...result.videos])
    setHasMore(result.hasMore)
    setPage(nextPage)
    setLoading(false)
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">
          No liked videos yet.
        </p>
        <p className="text-sm text-muted-foreground/70">
          Watch some videos and hit the Like button to see them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard
            key={video.videoId}
            videoId={video.videoId}
            title={video.title}
            thumbnail={video.thumbnail}
            channelName={video.channelName}
            channelId={video.channelId}
            publishedAt={video.publishedAt}
            duration={video.duration}
            isWatched={watchedIds.has(video.videoId)}
            hasNote={noteIds.has(video.videoId)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
