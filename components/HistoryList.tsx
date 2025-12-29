"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { removeFromHistory, type HistoryEntry, type GroupedHistory } from "@/actions/history"

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function groupByTime(entries: HistoryEntry[]): GroupedHistory {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = subDays(today, 1)
  const weekAgo = subDays(today, 7)
  const monthAgo = subDays(today, 30)

  return {
    today: entries.filter(e => new Date(e.watchedAt) >= today),
    yesterday: entries.filter(e => {
      const d = new Date(e.watchedAt)
      return d >= yesterday && d < today
    }),
    thisWeek: entries.filter(e => {
      const d = new Date(e.watchedAt)
      return d >= weekAgo && d < yesterday
    }),
    thisMonth: entries.filter(e => {
      const d = new Date(e.watchedAt)
      return d >= monthAgo && d < weekAgo
    }),
    older: entries.filter(e => new Date(e.watchedAt) < monthAgo)
  }
}

interface HistoryListProps {
  initialEntries: HistoryEntry[]
  initialHasMore: boolean
  onLoadMore: () => Promise<{ entries: HistoryEntry[]; hasMore: boolean }>
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function formatWatchedAt(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins <= 1 ? "Just now" : `${diffMins} min ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  })
}

function HistoryItem({ entry, onRemove }: { entry: HistoryEntry; onRemove: (id: number) => void }) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    await removeFromHistory(entry.id)
    onRemove(entry.id)
  }

  const progressPercent = entry.duration && entry.progress
    ? Math.min(100, Math.round((entry.progress / entry.duration) * 100))
    : entry.completed ? 100 : 0

  return (
    <Link
      href={`/watch/${entry.videoId}`}
      className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg group"
    >
      <div className="relative w-40 aspect-video flex-shrink-0">
        <Image
          src={entry.thumbnail}
          alt={entry.title}
          fill
          className="object-cover rounded"
          sizes="160px"
        />
        {entry.duration && (
          <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            {formatDuration(entry.duration)}
          </div>
        )}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600">
            <div
              className={`h-full ${entry.completed ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium line-clamp-2">{entry.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {entry.channelName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatWatchedAt(entry.watchedAt)}
          {entry.completed && " · Completed"}
        </p>
      </div>

      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-center"
        aria-label="Remove from history"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Link>
  )
}

function HistoryGroup({ title, entries, onRemove }: { title: string; entries: HistoryEntry[]; onRemove: (id: number) => void }) {
  if (entries.length === 0) return null

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
        {title}
      </h3>
      {entries.map(entry => (
        <HistoryItem key={entry.id} entry={entry} onRemove={onRemove} />
      ))}
    </div>
  )
}

export function HistoryList({ initialEntries, initialHasMore, onLoadMore }: HistoryListProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)

  // Sync state when props change (e.g., after search)
  useEffect(() => {
    setEntries(initialEntries)
    setHasMore(initialHasMore)
  }, [initialEntries, initialHasMore])

  async function handleLoadMore() {
    setLoading(true)
    const result = await onLoadMore()
    setEntries([...entries, ...result.entries])
    setHasMore(result.hasMore)
    setLoading(false)
  }

  function handleRemove(id: number) {
    setEntries(entries.filter(e => e.id !== id))
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No watch history yet.
        </p>
        <p className="text-sm text-gray-500">
          Videos you watch will appear here.
        </p>
      </div>
    )
  }

  const grouped = groupByTime(entries)

  return (
    <div className="space-y-6">
      <HistoryGroup title="Today" entries={grouped.today} onRemove={handleRemove} />
      <HistoryGroup title="Yesterday" entries={grouped.yesterday} onRemove={handleRemove} />
      <HistoryGroup title="This week" entries={grouped.thisWeek} onRemove={handleRemove} />
      <HistoryGroup title="This month" entries={grouped.thisMonth} onRemove={handleRemove} />
      <HistoryGroup title="Older" entries={grouped.older} onRemove={handleRemove} />

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
