"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface Category {
  id: number
  name: string
  color: string | null
}

interface Subscription {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
  categoryId: number | null
  category: Category | null
}

interface SubscriptionFilterProps {
  subscriptions: Subscription[]
  categories?: Category[]
}

export function SubscriptionFilter({ subscriptions, categories = [] }: SubscriptionFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get selected channels from URL (comma-separated)
  const selectedParam = searchParams.get("channels")
  const selectedIds = selectedParam ? selectedParam.split(",") : []

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function updateParams(channelIds: string[]) {
    const params = new URLSearchParams(searchParams.toString())

    if (channelIds.length > 0) {
      params.set("channels", channelIds.join(","))
    } else {
      params.delete("channels")
    }

    router.push(`/?${params.toString()}`, { scroll: false })
  }

  function selectAll() {
    updateParams([])
    setIsOpen(false)
  }

  function selectCategory(categoryId: number | null) {
    const channelIds = subscriptions
      .filter(s => s.categoryId === categoryId)
      .map(s => s.channelId)

    updateParams(channelIds)
    setIsOpen(false)
  }

  function toggleChannel(channelId: string) {
    const newSelected = selectedIds.includes(channelId)
      ? selectedIds.filter(id => id !== channelId)
      : [...selectedIds, channelId]

    updateParams(newSelected)
  }

  if (subscriptions.length === 0) return null

  // Group subscriptions by category
  const grouped = new Map<number | null, Subscription[]>()
  for (const sub of subscriptions) {
    const key = sub.categoryId
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(sub)
  }

  // Check if a category is fully selected
  function isCategoryActive(categoryId: number | null): boolean {
    const catChannels = subscriptions.filter(s => s.categoryId === categoryId).map(s => s.channelId)
    return catChannels.length > 0 &&
      catChannels.every(id => selectedIds.includes(id)) &&
      selectedIds.every(id => catChannels.includes(id))
  }

  // Uncategorized channels
  const uncategorizedChannels = grouped.get(null) || []

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* All button */}
      <button
        onClick={selectAll}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
          selectedIds.length === 0
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        All
      </button>

      {/* Category chips */}
      {categories.map(cat => {
        const isActive = isCategoryActive(cat.id)

        return (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              isActive
                ? "text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            style={isActive ? { backgroundColor: cat.color || "#3B82F6" } : {}}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color || "#6B7280" }}
            />
            {cat.name}
          </button>
        )
      })}

      {/* Channel overflow dropdown */}
      {uncategorizedChannels.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1 ${
              isCategoryActive(null)
                ? "bg-gray-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            +{uncategorizedChannels.length} channel{uncategorizedChannels.length !== 1 ? "s" : ""}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-2 w-64 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              <div className="p-1">
                {uncategorizedChannels.map((sub) => {
                  const isSelected = selectedIds.includes(sub.channelId)
                  return (
                    <button
                      key={sub.id}
                      onClick={() => toggleChannel(sub.channelId)}
                      className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {sub.thumbnail && (
                        <Image src={sub.thumbnail} alt="" width={20} height={20} className="rounded-full flex-shrink-0" />
                      )}
                      <span className="truncate">{sub.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
