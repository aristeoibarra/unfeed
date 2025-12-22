import { getLikedVideos } from "@/actions/reactions"
import { getWatchedVideoIds } from "@/actions/watched"
import { getVideoIdsWithNotes } from "@/actions/notes"
import { LikedVideoFeed } from "@/components/LikedVideoFeed"
import Link from "next/link"

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Liked Videos</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {result.total} {result.total === 1 ? "video" : "videos"}
          </p>
        </div>
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to feed
        </Link>
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
