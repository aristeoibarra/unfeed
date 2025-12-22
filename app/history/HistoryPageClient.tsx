"use client"

import { useState } from "react"
import { HistoryList } from "@/components/HistoryList"
import { getHistory, searchHistory, clearHistory, type HistoryEntry } from "@/actions/history"

interface HistoryPageClientProps {
  initialEntries: HistoryEntry[]
  initialHasMore: boolean
  totalCount: number
}

export function HistoryPageClient({
  initialEntries,
  initialHasMore,
  totalCount
}: HistoryPageClientProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [count, setCount] = useState(totalCount)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) {
      // Reset to initial state
      const result = await getHistory(1)
      setEntries(result.entries)
      setHasMore(result.hasMore)
      setPage(1)
      return
    }

    setSearching(true)
    const results = await searchHistory(search.trim())
    setEntries(results)
    setHasMore(false)
    setSearching(false)
  }

  async function handleClear() {
    if (!confirm("Are you sure you want to clear your entire watch history? This cannot be undone.")) {
      return
    }

    setClearing(true)
    await clearHistory()
    setEntries([])
    setHasMore(false)
    setCount(0)
    setClearing(false)
  }

  async function handleLoadMore() {
    const nextPage = page + 1
    const result = await getHistory(nextPage, search || undefined)
    setPage(nextPage)
    return result
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </form>

        {count > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear all"}
          </button>
        )}
      </div>

      <HistoryList
        initialEntries={entries}
        initialHasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}
