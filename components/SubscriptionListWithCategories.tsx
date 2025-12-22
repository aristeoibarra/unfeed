"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { deleteSubscription } from "@/actions/subscriptions"
import { assignCategory, type CategoryData } from "@/actions/categories"

interface Subscription {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
  categoryId: number | null
  category: { id: number; name: string; color: string | null } | null
}

interface SubscriptionListWithCategoriesProps {
  subscriptions: Subscription[]
  categories: CategoryData[]
}

export function SubscriptionListWithCategories({
  subscriptions: initialSubscriptions,
  categories
}: SubscriptionListWithCategoriesProps) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Sync state when props change (after router.refresh)
  useEffect(() => {
    setSubscriptions(initialSubscriptions)
  }, [initialSubscriptions])

  // Group subscriptions by category
  const grouped = new Map<number | null, Subscription[]>()

  for (const sub of subscriptions) {
    const key = sub.categoryId
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(sub)
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this subscription?")) return

    setDeletingId(id)
    const result = await deleteSubscription(id)

    if (result.success) {
      setSubscriptions(subscriptions.filter(s => s.id !== id))
    }

    setDeletingId(null)
  }

  async function handleCategoryChange(subscriptionId: number, categoryId: string) {
    const newCategoryId = categoryId === "" ? null : parseInt(categoryId)

    await assignCategory(subscriptionId, newCategoryId)

    setSubscriptions(subscriptions.map(s => {
      if (s.id === subscriptionId) {
        const newCategory = newCategoryId
          ? categories.find(c => c.id === newCategoryId)
          : null
        return {
          ...s,
          categoryId: newCategoryId,
          category: newCategory ? { id: newCategory.id, name: newCategory.name, color: newCategory.color } : null
        }
      }
      return s
    }))
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No subscriptions yet. Add a channel to get started.
      </p>
    )
  }

  // Render categories first, then uncategorized
  const categoryOrder = [...categories.map(c => c.id), null]

  return (
    <div className="space-y-6">
      {categoryOrder.map(categoryId => {
        const subs = grouped.get(categoryId)
        if (!subs || subs.length === 0) return null

        const category = categoryId ? categories.find(c => c.id === categoryId) : null

        return (
          <div key={categoryId ?? "uncategorized"}>
            <h3
              className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2"
            >
              {category && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color || "#6B7280" }}
                />
              )}
              {category?.name || "Uncategorized"}
              <span className="font-normal">({subs.length})</span>
            </h3>

            <div className="space-y-2">
              {subs.map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {/* Thumbnail */}
                  {subscription.thumbnail ? (
                    <img
                      src={subscription.thumbnail}
                      alt={subscription.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}

                  {/* Name */}
                  <Link
                    href={`/subscription/${subscription.channelId}`}
                    className="flex-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {subscription.name}
                  </Link>

                  {/* Category selector */}
                  <select
                    value={subscription.categoryId ?? ""}
                    onChange={(e) => handleCategoryChange(subscription.id, e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    style={{
                      borderLeftColor: subscription.category?.color || "transparent",
                      borderLeftWidth: subscription.category ? 3 : 1
                    }}
                  >
                    <option value="">No category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(subscription.id)}
                    disabled={deletingId === subscription.id}
                    className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                    title="Remove subscription"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
