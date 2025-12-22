"use client"

import { deleteSubscription } from "@/actions/subscriptions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Trash2, Loader2, ExternalLink, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

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
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Subscription | null>(null)

  async function handleDelete(sub: Subscription) {
    setDeletingId(sub.id)
    setConfirmDelete(null)

    try {
      await deleteSubscription(sub.id)
      toast({
        title: "Subscription removed",
        description: `${sub.name} has been removed from your subscriptions.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Failed to remove subscription",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No subscriptions yet"
        description="Add your first channel above to get started."
      />
    )
  }

  return (
    <>
      <ul className="space-y-2" role="list" aria-label="Your subscriptions">
        {subscriptions.map((sub) => (
          <li key={sub.id}>
            <div
              className={cn(
                "p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800",
                "flex items-center justify-between gap-4",
                "transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50",
                deletingId === sub.id && "opacity-50 pointer-events-none"
              )}
            >
              <Link
                href={`/subscription/${sub.channelId}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                {sub.thumbnail ? (
                  <img
                    src={sub.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                )}
                <span className="font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {sub.name}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" aria-hidden="true" />
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete(sub)}
                disabled={deletingId === sub.id}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                aria-label={`Remove ${sub.name} from subscriptions`}
              >
                {deletingId === sub.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{confirmDelete?.name}</strong> from your subscriptions? Their videos will no longer appear in your feed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
