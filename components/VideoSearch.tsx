"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Loader2, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command"
import { searchVideos, getRecentVideos, type SearchResult } from "@/actions/search"
import { useDebounce } from "@/hooks/use-debounce"

/**
 * Format duration from seconds to human readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

/**
 * Format relative time for better TDA user comprehension
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`
    }
  }

  return "Just now"
}

/**
 * Search result item component
 * Designed for TDA accessibility:
 * - Clear visual hierarchy
 * - Thumbnail for quick recognition
 * - Essential info only (title, channel, time)
 */
function SearchResultItem({
  result,
  onSelect,
}: {
  result: SearchResult
  onSelect: () => void
}) {
  return (
    <CommandItem
      value={`${result.title} ${result.channelName}`}
      onSelect={onSelect}
      className="flex items-start gap-3 p-2 cursor-pointer"
    >
      {/* Thumbnail - Small for quick scanning */}
      <div className="relative flex-shrink-0 w-20 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={result.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Duration badge */}
        {result.duration != null && result.duration > 0 && (
          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/80 text-white text-[10px] font-medium rounded">
            {formatDuration(result.duration)}
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {result.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {result.channelName}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {getTimeAgo(result.publishedAt)}
        </p>
      </div>
    </CommandItem>
  )
}

/**
 * VideoSearch component
 *
 * TDA-Friendly Design Decisions:
 * 1. Clear keyboard shortcut (Cmd/Ctrl + K) shown in trigger button
 * 2. Debounced search (300ms) to reduce visual noise
 * 3. Limited results (10 max) to avoid overwhelming
 * 4. Clear loading and empty states
 * 5. Recent videos shown immediately for context
 * 6. Large touch targets for mobile
 * 7. Smooth transitions (150ms) for state changes
 * 8. Clear visual feedback on selection
 */
export function VideoSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [recentVideos, setRecentVideos] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [totalCount, setTotalCount] = React.useState(0)

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300)

  // Keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Load recent videos when dialog opens
  React.useEffect(() => {
    if (open && recentVideos.length === 0) {
      getRecentVideos().then(setRecentVideos)
    }
  }, [open, recentVideos.length])

  // Search when debounced query changes
  React.useEffect(() => {
    async function performSearch() {
      if (debouncedQuery.length < 2) {
        setResults([])
        setTotalCount(0)
        return
      }

      setIsLoading(true)
      try {
        const response = await searchVideos(debouncedQuery)
        setResults(response.results)
        setTotalCount(response.totalCount)
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  // Handle video selection
  const handleSelect = React.useCallback(
    (videoId: string) => {
      setOpen(false)
      setQuery("")
      router.push(`/watch/${videoId}`)
    },
    [router]
  )

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Small delay to allow closing animation
      const timer = setTimeout(() => {
        setQuery("")
        setResults([])
        setTotalCount(0)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Determine what to show based on query state
  const hasQuery = query.length >= 2
  const isTyping = query !== debouncedQuery
  const showLoading = isLoading || isTyping
  const showResults = hasQuery && !showLoading && results.length > 0
  const showEmpty = hasQuery && !showLoading && results.length === 0
  const showRecent = !hasQuery && recentVideos.length > 0

  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-9 justify-start",
          // Desktop: Wider with keyboard shortcut visible
          "hidden md:flex md:w-64 lg:w-80",
          // Text styling
          "text-sm text-gray-500 dark:text-gray-400",
          // Border and background
          "border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-gray-950",
          // Focus state - clear for TDA users
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        )}
        aria-label="Search videos. Press Command K to open search."
      >
        <Search className="mr-2 h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search videos...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:flex">
          <span className="text-xs">Cmd</span>K
        </kbd>
      </Button>

      {/* Mobile search button - Icon only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Search videos"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by video title or channel..."
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <CommandList>
          {/* Loading state */}
          {showLoading && (
            <CommandLoading>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Searching...</span>
              </div>
            </CommandLoading>
          )}

          {/* Empty state */}
          {showEmpty && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Film className="h-8 w-8 opacity-50" aria-hidden="true" />
                <p>No videos found for &quot;{debouncedQuery}&quot;</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            </CommandEmpty>
          )}

          {/* Search results */}
          {showResults && (
            <CommandGroup
              heading={
                totalCount > results.length
                  ? `Top ${results.length} of ${totalCount} results`
                  : `${results.length} result${results.length !== 1 ? "s" : ""}`
              }
            >
              {results.map((result) => (
                <SearchResultItem
                  key={result.videoId}
                  result={result}
                  onSelect={() => handleSelect(result.videoId)}
                />
              ))}
            </CommandGroup>
          )}

          {/* Recent videos - shown when no query */}
          {showRecent && (
            <CommandGroup heading="Recent videos">
              {recentVideos.map((video) => (
                <SearchResultItem
                  key={video.videoId}
                  result={video}
                  onSelect={() => handleSelect(video.videoId)}
                />
              ))}
            </CommandGroup>
          )}

          {/* Initial state - no recent videos */}
          {!hasQuery && recentVideos.length === 0 && !showLoading && (
            <div className="py-6 text-center text-sm text-gray-500">
              <Video className="mx-auto h-8 w-8 opacity-50 mb-2" aria-hidden="true" />
              <p>Start typing to search videos</p>
            </div>
          )}
        </CommandList>

        {/* Footer with keyboard hints - TDA friendly */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-3 py-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 font-mono text-[10px]">
              Up/Down
            </kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>
            <span>to select</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <kbd className="rounded border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  )
}
