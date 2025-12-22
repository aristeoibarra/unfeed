import { getSubscription } from "@/actions/subscriptions"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideosByChannel } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { getReactions } from "@/actions/reactions"
import { SubscriptionHeader } from "@/components/SubscriptionHeader"
import { VideoFeed } from "@/components/VideoFeed"
import Link from "next/link"
import { notFound } from "next/navigation"

interface SubscriptionPageProps {
  params: Promise<{ channelId: string }>
}

export async function generateMetadata({ params }: SubscriptionPageProps) {
  const { channelId } = await params
  const subscription = await getSubscription(channelId)

  if (!subscription) {
    return { title: "Subscription not found - Unfeed" }
  }

  return {
    title: `${subscription.name} - Unfeed`,
    description: `Videos from ${subscription.name}`,
  }
}

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { channelId } = await params
  const [subscription, result, watchedIds, noteIds] = await Promise.all([
    getSubscription(channelId),
    getVideosByChannel(channelId),
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
  ])

  if (!subscription) {
    notFound()
  }

  const videoIds = result.videos.map(v => v.videoId)
  const reactions = await getReactions(videoIds)

  const watchedSet = new Set(watchedIds)
  const noteSet = new Set(noteIds)

  return (
    <div className="space-y-6">
      <SubscriptionHeader subscription={subscription} videoCount={result.total} />

      {result.videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No videos yet. Videos will appear after the next sync.
          </p>
        </div>
      ) : (
        <VideoFeed
          initialVideos={result.videos}
          initialHasMore={result.hasMore}
          watchedIds={watchedSet}
          noteIds={noteSet}
          reactions={reactions}
          filterChannelIds={[channelId]}
        />
      )}

      <Link
        href="/"
        className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to feed
      </Link>
    </div>
  )
}
