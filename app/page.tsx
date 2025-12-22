import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideos } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { getReactions, getDislikedVideoIds } from "@/actions/reactions"
import { getSettings } from "@/actions/settings"
import { SubscriptionFilter } from "@/components/SubscriptionFilter"
import { VideoFeed } from "@/components/VideoFeed"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
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
    <div className="space-y-8">
      {/* Page header - Clear hierarchy for TDA users */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Feed</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
            {videosToShow.length > 0 && ` - ${videosToShow.length} video${videosToShow.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/subscriptions">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4" aria-hidden="true" />
            Manage subscriptions
          </Button>
        </Link>
      </header>

      {/* Filter section - Only show if there are subscriptions */}
      {subscriptions.length > 0 && (
        <section aria-label="Filter videos">
          <SubscriptionFilter subscriptions={subscriptions} categories={categories} />
        </section>
      )}

      {/* Content section */}
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No subscriptions yet"
          description="Add some channels to start seeing their latest videos in your feed. No distractions, just the content you care about."
          action={
            <Link href="/subscriptions">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add your first subscription
              </Button>
            </Link>
          }
        />
      ) : videosToShow.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No videos yet"
          description="Videos will appear here after the next sync. This usually happens automatically every few hours."
        />
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
