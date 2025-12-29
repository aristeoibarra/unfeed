"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { deleteSubscription, toggleSyncEnabled } from "@/actions/subscriptions"
import { assignCategory, type CategoryData } from "@/actions/categories"
import { syncSingleChannel } from "@/actions/sync"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Subscription {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
  categoryId: number | null
  syncEnabled: boolean
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
    setDeletingId(id)
    const result = await deleteSubscription(id)

    if (result.success) {
      setSubscriptions(subscriptions.filter(s => s.id !== id))
    }

    setDeletingId(null)
    setConfirmDeleteId(null)
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

  function handleSync(channelId: string) {
    setSyncingChannelId(channelId)
    startTransition(async () => {
      await syncSingleChannel(channelId)
      setSyncingChannelId(null)
    })
  }

  async function handleToggleSyncEnabled(id: number) {
    const result = await toggleSyncEnabled(id)
    if (result.success) {
      setSubscriptions(subscriptions.map(s =>
        s.id === id ? { ...s, syncEnabled: result.data } : s
      ))
    }
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
                    <Image
                      src={subscription.thumbnail}
                      alt={subscription.name}
                      width={40}
                      height={40}
                      className="rounded-full"
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

                  {/* Auto-sync toggle */}
                  <button
                    onClick={() => handleToggleSyncEnabled(subscription.id)}
                    className={`p-2 rounded transition-colors ${
                      subscription.syncEnabled
                        ? "text-green-600 hover:text-green-700 dark:text-green-500"
                        : "text-gray-400 hover:text-gray-500"
                    }`}
                    title={subscription.syncEnabled ? "Auto-sync enabled (click to pause)" : "Auto-sync paused (click to enable)"}
                  >
                    {subscription.syncEnabled ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                    )}
                  </button>

                  {/* Sync button */}
                  <button
                    onClick={() => handleSync(subscription.channelId)}
                    disabled={syncingChannelId === subscription.channelId || isPending}
                    className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Sync this channel now"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`w-5 h-5 ${syncingChannelId === subscription.channelId ? "animate-spin" : ""}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDeleteId(subscription.id)}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the channel from your subscriptions. You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
