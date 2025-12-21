import { getVideos } from "@/actions/videos"
import { VideoCard } from "@/components/VideoCard"
import Link from "next/link"

export default async function Home() {
  const videos = await getVideos()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <Link
          href="/channels"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage channels
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No videos yet. Add some channels to get started.
          </p>
          <Link
            href="/channels"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Channels
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              thumbnail={video.thumbnail}
              channelName={video.channelName}
              publishedAt={video.publishedAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
