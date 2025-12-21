import { getSubscriptions } from "@/actions/subscriptions"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideos } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { SubscriptionFilter } from "@/components/SubscriptionFilter"
import { VideoFeed } from "@/components/VideoFeed"
import Link from "next/link"

interface HomeProps {
  searchParams: Promise<{ channels?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { channels } = await searchParams
  const filterChannelIds = channels ? channels.split(",") : undefined

  const [result, watchedIds, noteIds, subscriptions] = await Promise.all([
    getVideos(filterChannelIds),
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
    getSubscriptions()
  ])

  const watchedSet = new Set(watchedIds)
  const noteSet = new Set(noteIds)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <Link
          href="/subscriptions"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage subscriptions
        </Link>
      </div>

      <SubscriptionFilter subscriptions={subscriptions} />

      {result.videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No videos yet. Add some subscriptions to get started.
          </p>
          <Link
            href="/subscriptions"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Subscriptions
          </Link>
        </div>
      ) : (
        <VideoFeed
          initialVideos={result.videos}
          initialPageTokens={result.pageTokens}
          watchedIds={watchedSet}
          noteIds={noteSet}
          filterChannelIds={filterChannelIds}
        />
      )}
    </div>
  )
}
