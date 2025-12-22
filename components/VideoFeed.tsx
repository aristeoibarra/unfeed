"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw, Video } from "lucide-react"
import { VideoCard, VideoCardSkeleton } from "./VideoCard"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { loadMoreVideos, type VideoInfo } from "@/actions/videos"

type ReactionType = "like" | "dislike"

interface VideoFeedProps {
  initialVideos: VideoInfo[]
  initialHasMore: boolean
  watchedIds: Set<string>
  noteIds: Set<string>
  reactions: Map<string, ReactionType>
  filterChannelIds?: string[]
}

export function VideoFeed({
  initialVideos,
  initialHasMore,
  watchedIds,
  noteIds,
  reactions,
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
    try {
      const nextPage = page + 1
      const result = await loadMoreVideos(filterChannelIds, nextPage)

      setVideos([...videos, ...result.videos])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (error) {
      console.error("Failed to load more videos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={<Video className="h-8 w-8" />}
        title="No videos yet"
        description="Add some channels to get started. Videos will appear here after the next sync."
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Video grid - Responsive with TDA-friendly spacing */}
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="feed"
        aria-label="Video feed"
        aria-busy={loading}
      >
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
            reaction={reactions.get(video.videoId) ?? null}
          />
        ))}
      </div>

      {/* Load more section */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading more...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Load more videos
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {videos.length} videos
          </p>
        </div>
      )}
    </div>
  )
}

// Loading skeleton for initial page load
export function VideoFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
