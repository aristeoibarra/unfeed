"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"

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

  function toggleChannel(channelId: string) {
    const newSelected = selectedIds.includes(channelId)
      ? selectedIds.filter(id => id !== channelId)
      : [...selectedIds, channelId]

    const params = new URLSearchParams(searchParams.toString())

    if (newSelected.length > 0) {
      params.set("channels", newSelected.join(","))
    } else {
      params.delete("channels")
    }

    router.push(`/?${params.toString()}`)
  }

  function selectAll() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("channels")
    router.push(`/?${params.toString()}`)
    setIsOpen(false)
  }

  function selectCategory(categoryId: number | null) {
    const channelIds = subscriptions
      .filter(s => s.categoryId === categoryId)
      .map(s => s.channelId)

    const params = new URLSearchParams(searchParams.toString())

    if (channelIds.length > 0) {
      params.set("channels", channelIds.join(","))
    } else {
      params.delete("channels")
    }

    router.push(`/?${params.toString()}`)
    setIsOpen(false)
  }

  if (subscriptions.length === 0) return null

  const selectedNames = subscriptions
    .filter(s => selectedIds.includes(s.channelId))
    .map(s => s.name)

  const buttonText = selectedIds.length === 0
    ? "All subscriptions"
    : selectedIds.length === 1
      ? selectedNames[0]
      : `${selectedIds.length} selected`

  // Group subscriptions by category
  const grouped = new Map<number | null, Subscription[]>()
  for (const sub of subscriptions) {
    const key = sub.categoryId
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(sub)
  }

  return (
    <div className="space-y-3">
      {/* Category quick filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={selectAll}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedIds.length === 0
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          {categories.map(cat => {
            const catChannels = subscriptions.filter(s => s.categoryId === cat.id).map(s => s.channelId)
            const isActive = catChannels.length > 0 &&
              catChannels.every(id => selectedIds.includes(id)) &&
              selectedIds.every(id => catChannels.includes(id))

            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
                style={isActive ? { backgroundColor: cat.color || "#3B82F6" } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color || "#6B7280" }}
                />
                {cat.name}
              </button>
            )
          })}
          {grouped.has(null) && (
            <button
              onClick={() => selectCategory(null)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                grouped.get(null)?.every(s => selectedIds.includes(s.channelId)) &&
                selectedIds.every(id => grouped.get(null)?.map(s => s.channelId).includes(id))
                  ? "bg-gray-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Uncategorized
            </button>
          )}
        </div>
      )}

      {/* Dropdown for individual channel selection */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700"
        >
          <span>{buttonText}</span>
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
          <div className="absolute z-10 mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <button
              onClick={selectAll}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                selectedIds.length === 0 ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                selectedIds.length === 0 ? "bg-blue-600 border-blue-600" : "border-gray-400"
              }`}>
                {selectedIds.length === 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span>All subscriptions</span>
            </button>

            {/* Grouped by category */}
            {[...categories, null].map(cat => {
              const categoryId = cat?.id ?? null
              const subs = grouped.get(categoryId)
              if (!subs || subs.length === 0) return null

              return (
                <div key={categoryId ?? "uncategorized"}>
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2">
                    {cat && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color || "#6B7280" }}
                      />
                    )}
                    {cat?.name || "Uncategorized"}
                  </div>
                  {subs.map((sub) => {
                    const isSelected = selectedIds.includes(sub.channelId)
                    return (
                      <button
                        key={sub.id}
                        onClick={() => toggleChannel(sub.channelId)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"
                        }`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {sub.thumbnail && (
                          <img src={sub.thumbnail} alt="" className="w-5 h-5 rounded-full" />
                        )}
                        <span className="truncate">{sub.name}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
