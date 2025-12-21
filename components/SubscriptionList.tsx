"use client"

import { deleteSubscription } from "@/actions/subscriptions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

interface Subscription {
  id: number
  channelId: string
  name: string
  thumbnail: string | null
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
}

export function SubscriptionList({ subscriptions }: SubscriptionListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleDelete(id: number) {
    setDeletingId(id)
    await deleteSubscription(id)
    router.refresh()
    setDeletingId(null)
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No subscriptions yet. Add your first one above.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {subscriptions.map((sub) => (
        <li
          key={sub.id}
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
        >
          <Link
            href={`/subscription/${sub.channelId}`}
            className="flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {sub.thumbnail && (
              <img
                src={sub.thumbnail}
                alt={sub.name}
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-medium">{sub.name}</span>
          </Link>
          <button
            onClick={() => handleDelete(sub.id)}
            disabled={deletingId === sub.id}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
          >
            {deletingId === sub.id ? "Removing..." : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  )
}
