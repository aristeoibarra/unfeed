import { getHistory, getHistoryCount } from "@/actions/history"
import { HistoryPageClient } from "./HistoryPageClient"
import Link from "next/link"

export const metadata = {
  title: "Watch History - Unfeed",
  description: "Your video watch history"
}

export default async function HistoryPage() {
  const [result, totalCount] = await Promise.all([
    getHistory(1),
    getHistoryCount()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watch History</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {totalCount} {totalCount === 1 ? "entry" : "entries"}
          </p>
        </div>
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to feed
        </Link>
      </div>

      <HistoryPageClient
        initialEntries={result.entries}
        initialHasMore={result.hasMore}
        totalCount={totalCount}
      />
    </div>
  )
}
