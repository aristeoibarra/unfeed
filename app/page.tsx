import { getChannels } from "@/actions/channels"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideos } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { ChannelFilter } from "@/components/ChannelFilter"
import { VideoFeed } from "@/components/VideoFeed"
import Link from "next/link"

interface HomeProps {
  searchParams: Promise<{ channel?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { channel: filterChannel } = await searchParams

  const [result, watchedIds, noteIds, channels] = await Promise.all([
    getVideos(filterChannel),
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
    getChannels()
  ])

  const watchedSet = new Set(watchedIds)
  const noteSet = new Set(noteIds)

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

      <ChannelFilter channels={channels} />

      {result.videos.length === 0 ? (
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
        <VideoFeed
          initialVideos={result.videos}
          initialPageTokens={result.pageTokens}
          watchedIds={watchedSet}
          noteIds={noteSet}
          filterChannelId={filterChannel}
        />
      )}
    </div>
  )
}
