import { getWatchLater } from "@/actions/watch-later"
import { getWatchedVideoIds } from "@/actions/watched"
import { VideoCard } from "@/components/VideoCard"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Watch Later</h1>
        <span className="text-gray-600 dark:text-gray-400">
          {watchLater.length} video{watchLater.length !== 1 ? "s" : ""}
        </span>
      </div>

      {watchLater.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No videos saved for later.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Feed
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
