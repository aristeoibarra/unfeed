"use client"

import { useState, useEffect } from "react"
import { VideoCard } from "./VideoCard"
import { loadMoreVideos, type VideoInfo } from "@/actions/videos"

interface VideoFeedProps {
  initialVideos: VideoInfo[]
  initialHasMore: boolean
  watchedIds: Set<string>
  noteIds: Set<string>
  filterChannelIds?: string[]
}

export function VideoFeed({
  initialVideos,
  initialHasMore,
  watchedIds,
  noteIds,
  filterChannelIds,
}: VideoFeedProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Reset state when filter changes
  useEffect(() => {
    setVideos(initialVideos)
    setHasMore(initialHasMore)
    setPage(1)
  }, [initialVideos, initialHasMore, filterChannelIds])

  async function handleLoadMore() {
    setLoading(true)
    const nextPage = page + 1
    const result = await loadMoreVideos(filterChannelIds, nextPage)

    setVideos([...videos, ...result.videos])
    setHasMore(result.hasMore)
    setPage(nextPage)
    setLoading(false)
  }

  if (videos.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No videos yet. Add some channels to get started.
      </p>
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
            className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
