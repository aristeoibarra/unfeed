import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideos } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { getReactions, getDislikedVideoIds } from "@/actions/reactions"
import { getSettings } from "@/actions/settings"
import { SubscriptionFilter } from "@/components/SubscriptionFilter"
import { VideoFeed } from "@/components/VideoFeed"
import Link from "next/link"

interface HomeProps {
  searchParams: Promise<{ channels?: string }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { channels } = await searchParams
  const filterChannelIds = channels ? channels.split(",") : undefined

  const [result, watchedIds, noteIds, subscriptions, categories, settings] = await Promise.all([
    getVideos(filterChannelIds),
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
    getSubscriptions(),
    getCategories(),
    getSettings()
  ])

  // Filter out disliked videos if setting is enabled
  let videosToShow = result.videos
  let dislikedIds: string[] = []

  if (settings.hideDislikedFromFeed) {
    dislikedIds = await getDislikedVideoIds()
    const dislikedSet = new Set(dislikedIds)
    videosToShow = result.videos.filter(v => !dislikedSet.has(v.videoId))
  }

  // Get reactions for displayed videos
  const videoIds = videosToShow.map(v => v.videoId)
  const reactions = await getReactions(videoIds)

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

      <SubscriptionFilter subscriptions={subscriptions} categories={categories} />

      {videosToShow.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {subscriptions.length === 0
              ? "No subscriptions yet. Add some channels to get started."
              : "No videos yet. Videos will appear after the next sync."}
          </p>
          {subscriptions.length === 0 ? (
            <Link
              href="/subscriptions"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Subscriptions
            </Link>
          ) : null}
        </div>
      ) : (
        <VideoFeed
          initialVideos={videosToShow}
          initialHasMore={result.hasMore}
          watchedIds={watchedSet}
          noteIds={noteSet}
          reactions={reactions}
          filterChannelIds={filterChannelIds}
        />
      )}
    </div>
  )
}
