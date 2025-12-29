"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Search,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  PauseCircle,
  Trash2,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Users
} from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number | null>>(new Set())

  // Sync state when props change (after router.refresh)
  useEffect(() => {
    setSubscriptions(initialSubscriptions)
  }, [initialSubscriptions])

  // Filter subscriptions based on search
  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery.trim()) return subscriptions
    const query = searchQuery.toLowerCase()
    return subscriptions.filter(sub =>
      sub.name.toLowerCase().includes(query)
    )
  }, [subscriptions, searchQuery])

  // Group subscriptions by category
  const grouped = useMemo(() => {
    const map = new Map<number | null, Subscription[]>()
    for (const sub of filteredSubscriptions) {
      const key = sub.categoryId
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(sub)
    }
    return map
  }, [filteredSubscriptions])

  async function handleDelete(id: number) {
    setDeletingId(id)
    const result = await deleteSubscription(id)

    if (result.success) {
      setSubscriptions(subscriptions.filter(s => s.id !== id))
    }

    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  async function handleCategoryChange(subscriptionId: number, categoryId: number | null) {
    await assignCategory(subscriptionId, categoryId)

    setSubscriptions(subscriptions.map(s => {
      if (s.id === subscriptionId) {
        const newCategory = categoryId
          ? categories.find(c => c.id === categoryId)
          : null
        return {
          ...s,
          categoryId: categoryId,
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

  function toggleCategoryCollapse(categoryId: number | null) {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          No subscriptions yet. Add a channel to get started.
        </p>
      </div>
    )
  }

  // Render categories first, then uncategorized
  const categoryOrder = [...categories.map(c => c.id), null]

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? "channel" : "channels"} found
        </p>
      )}

      {/* Channel list by category */}
      <div className="space-y-6">
        {categoryOrder.map(categoryId => {
          const subs = grouped.get(categoryId)
          if (!subs || subs.length === 0) return null

          const category = categoryId ? categories.find(c => c.id === categoryId) : null
          const isCollapsed = collapsedCategories.has(categoryId)

          return (
            <div key={categoryId ?? "uncategorized"}>
              {/* Category header */}
              <button
                onClick={() => toggleCategoryCollapse(categoryId)}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                {category && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color || "#6B7280" }}
                  />
                )}
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  {category?.name || "Uncategorized"}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({subs.length})
                </span>
              </button>

              {/* Channel cards */}
              {!isCollapsed && (
                <div className="grid gap-2">
                  {subs.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      {/* Thumbnail with category ring */}
                      <Link
                        href={`/subscription/${subscription.channelId}`}
                        className="relative flex-shrink-0"
                      >
                        <div
                          className="w-12 h-12 rounded-full p-0.5"
                          style={{
                            background: subscription.category?.color
                              ? `linear-gradient(135deg, ${subscription.category.color}, ${subscription.category.color}80)`
                              : "transparent"
                          }}
                        >
                          {subscription.thumbnail ? (
                            <Image
                              src={subscription.thumbnail}
                              alt={subscription.name}
                              width={44}
                              height={44}
                              className="rounded-full bg-muted"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-lg font-semibold text-muted-foreground">
                                {subscription.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Sync status indicator */}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center ${
                            subscription.syncEnabled ? "bg-success" : "bg-muted"
                          }`}
                          title={subscription.syncEnabled ? "Auto-sync enabled" : "Auto-sync paused"}
                        >
                          {subscription.syncEnabled ? (
                            <CheckCircle className="h-2.5 w-2.5 text-success-foreground" />
                          ) : (
                            <PauseCircle className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </div>
                      </Link>

                      {/* Channel info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/subscription/${subscription.channelId}`}
                          className="font-medium text-sm hover:text-primary transition-colors truncate block"
                        >
                          {subscription.name}
                        </Link>
                        {subscription.category && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subscription.category.color || "#6B7280" }}
                            />
                            {subscription.category.name}
                          </span>
                        )}
                      </div>

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            aria-label="Channel actions"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* Sync now */}
                          <DropdownMenuItem
                            onClick={() => handleSync(subscription.channelId)}
                            disabled={syncingChannelId === subscription.channelId || isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncingChannelId === subscription.channelId ? "animate-spin" : ""}`} />
                            Sync now
                          </DropdownMenuItem>

                          {/* Toggle auto-sync */}
                          <DropdownMenuItem onClick={() => handleToggleSyncEnabled(subscription.id)}>
                            {subscription.syncEnabled ? (
                              <>
                                <PauseCircle className="h-4 w-4 mr-2" />
                                Pause auto-sync
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Enable auto-sync
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Category submenu */}
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Category
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={() => handleCategoryChange(subscription.id, null)}
                              >
                                <span className={`w-2 h-2 rounded-full bg-muted mr-2`} />
                                No category
                                {subscription.categoryId === null && (
                                  <CheckCircle className="h-3 w-3 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                              {categories.map(cat => (
                                <DropdownMenuItem
                                  key={cat.id}
                                  onClick={() => handleCategoryChange(subscription.id, cat.id)}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full mr-2"
                                    style={{ backgroundColor: cat.color || "#6B7280" }}
                                  />
                                  {cat.name}
                                  {subscription.categoryId === cat.id && (
                                    <CheckCircle className="h-3 w-3 ml-auto text-primary" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          {/* View on YouTube */}
                          <DropdownMenuItem asChild>
                            <a
                              href={`https://www.youtube.com/channel/${subscription.channelId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on YouTube
                            </a>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Delete */}
                          <DropdownMenuItem
                            onClick={() => setConfirmDeleteId(subscription.id)}
                            disabled={deletingId === subscription.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No results message */}
      {searchQuery && filteredSubscriptions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No channels match "{searchQuery}"
          </p>
        </div>
      )}

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
