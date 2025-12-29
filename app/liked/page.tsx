import { getLikedVideos } from "@/actions/reactions"
import { getWatchedVideoIds } from "@/actions/watched"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { LikedVideoFeed } from "@/components/LikedVideoFeed"

export const metadata = {
  title: "Liked Videos - Unfeed",
  description: "Videos you liked"
}

export default async function LikedPage() {
  const [result, watchedIds, noteIds] = await Promise.all([
    getLikedVideos(),
    getWatchedVideoIds(),
    getVideoIdsWithNotes()
  ])

  const watchedSet = new Set(watchedIds)
  const noteSet = new Set(noteIds)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liked Videos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {result.total} {result.total === 1 ? "video" : "videos"}
        </p>
      </div>

      <LikedVideoFeed
        initialVideos={result.videos}
        initialHasMore={result.hasMore}
        watchedIds={watchedSet}
        noteIds={noteSet}
      />
    </div>
  )
}
