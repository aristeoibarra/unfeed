import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { getVideos, type SortOption } from "@/actions/videos"
import { getWatchedVideoIds } from "@/actions/watched"
import { getReactions, getDislikedVideoIds } from "@/actions/reactions"
import { getSettings } from "@/actions/settings"
import { SubscriptionFilter } from "@/components/SubscriptionFilter"
import { HomeFilters } from "@/components/HomeFilters"
import { VideoFeed } from "@/components/VideoFeed"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import Link from "next/link"

interface HomeProps {
  searchParams: Promise<{
    channels?: string
    sort?: SortOption
    unwatched?: string
    q?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const { channels, sort, unwatched, q } = await searchParams
  const filterChannelIds = channels ? channels.split(",") : undefined
  const unwatchedOnly = unwatched === "true"

  const [watchedIds, noteIds, subscriptions, categories, settings] = await Promise.all([
    getWatchedVideoIds(),
    getVideoIdsWithNotes(),
    getSubscriptions(),
    getCategories(),
    getSettings()
  ])

  // Get videos with filters
  const result = await getVideos(
    {
      channelIds: filterChannelIds,
      sort: sort || "newest",
      unwatchedOnly,
      search: q
    },
    1,
    unwatchedOnly ? watchedIds : undefined
  )

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
      {/* Search, sort, and filter section - Only show if there are subscriptions */}
      {subscriptions.length > 0 && (
        <section aria-label="Filter videos" className="space-y-4">
          <HomeFilters />
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
            <Link href="/channels">
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
          filters={{
            channelIds: filterChannelIds,
            sort: sort || "newest",
            unwatchedOnly,
            search: q
          }}
          watchedVideoIds={unwatchedOnly ? watchedIds : undefined}
        />
      )}
    </div>
  )
}
