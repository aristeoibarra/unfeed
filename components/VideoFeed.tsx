"use client"

import { useState, useEffect } from "react"
import { VideoCard } from "./VideoCard"
import { loadMoreVideos, type VideoInfo } from "@/actions/videos"

interface VideoFeedProps {
  initialVideos: VideoInfo[]
  initialPageTokens: Record<string, string | null>
  watchedIds: Set<string>
  noteIds: Set<string>
  filterChannelIds?: string[]
}

export function VideoFeed({
  initialVideos,
  initialPageTokens,
  watchedIds,
  noteIds,
  filterChannelIds,
}: VideoFeedProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [pageTokens, setPageTokens] = useState(initialPageTokens)
  const [loading, setLoading] = useState(false)

  // Reset state when filter changes
  useEffect(() => {
    setVideos(initialVideos)
    setPageTokens(initialPageTokens)
  }, [initialVideos, initialPageTokens, filterChannelIds])

  const hasMore = Object.values(pageTokens).some(token => token !== null)

  async function handleLoadMore() {
    setLoading(true)
    const result = await loadMoreVideos(pageTokens, filterChannelIds)

    // Filter out duplicates
    const existingIds = new Set(videos.map(v => v.videoId))
    const newVideos = result.videos.filter(v => !existingIds.has(v.videoId))

    setVideos([...videos, ...newVideos])
    setPageTokens(result.pageTokens)
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
