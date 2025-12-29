import { getWatchLater } from "@/actions/watch-later"
import { getWatchedVideoIds } from "@/actions/watched"
import { VideoCard } from "@/components/VideoCard"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { BookmarkCheck, Video } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Watch Later - Unfeed",
}

export default async function WatchLaterPage() {
  const [watchLater, watchedIds] = await Promise.all([
    getWatchLater(),
    getWatchedVideoIds()
  ])

  const watchedSet = new Set(watchedIds)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-xl">
            <BookmarkCheck className="h-6 w-6 text-success" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Watch Later</h1>
            <p className="text-muted-foreground text-sm">
              {watchLater.length} {watchLater.length === 1 ? "video" : "videos"} saved
            </p>
          </div>
        </div>
      </header>

      {watchLater.length === 0 ? (
        <EmptyState
          icon={<Video className="h-8 w-8" />}
          title="No videos saved"
          description="When you find videos you want to watch later, save them here for easy access."
          action={
            <Link href="/">
              <Button>
                Browse feed
              </Button>
            </Link>
          }
        />
      ) : (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="feed"
          aria-label="Watch later videos"
        >
          {watchLater.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              thumbnail={video.thumbnail}
              channelName={video.channelName}
              channelId={video.channelId}
              publishedAt={video.addedAt.toISOString()}
              isWatched={watchedSet.has(video.videoId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
