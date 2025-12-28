"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback, useTransition, useEffect } from "react"
import { Search, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_likes", label: "Most likes" },
  { value: "longest", label: "Longest" },
  { value: "shortest", label: "Shortest" },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]["value"]

export function HomeFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current values from URL
  const currentSort = (searchParams.get("sort") as SortOption) || "newest"
  const currentSearch = searchParams.get("q") || ""
  const currentUnwatched = searchParams.get("unwatched") === "true"

  // Local state for search input
  const [searchQuery, setSearchQuery] = useState(currentSearch)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === "" || (key === "sort" && value === "newest")) {
            params.delete(key)
          } else {
            params.set(key, value)
          }
        }

        const queryString = params.toString()
        router.push(queryString ? `/?${queryString}` : "/", { scroll: false })
      })
    },
    [router, searchParams]
  )

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      updateParams({ q: debouncedSearch || null })
    }
  }, [debouncedSearch, currentSearch, updateParams])

  const handleSortChange = (sort: SortOption) => {
    updateParams({ sort: sort === "newest" ? null : sort })
  }

  const toggleUnwatched = () => {
    updateParams({ unwatched: currentUnwatched ? null : "true" })
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label || "Newest"

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
          aria-label="Search videos"
        />
      </div>

      {/* Sort dropdown and unwatched toggle */}
      <div className="flex gap-2">
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 min-w-[120px] justify-between",
                isPending && "opacity-70"
              )}
            >
              {currentSortLabel}
              <ChevronDown className="h-4 w-4 ml-2 opacity-50" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={cn(
                  currentSort === option.value && "bg-blue-50 dark:bg-blue-950"
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Unwatched toggle */}
        <Button
          variant={currentUnwatched ? "default" : "outline"}
          onClick={toggleUnwatched}
          className={cn(
            "h-10 gap-2",
            currentUnwatched && "bg-blue-600 hover:bg-blue-700"
          )}
          aria-pressed={currentUnwatched}
        >
          {currentUnwatched ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Unwatched</span>
        </Button>
      </div>
    </div>
  )
}
