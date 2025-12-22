"use client"

import { useState } from "react"
import Link from "next/link"
import { getNotifications, markAsRead, markAllAsRead, type NotificationData } from "@/actions/notifications"

// Formatea duración de segundos a MM:SS o H:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

// Tiempo relativo detallado
function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
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

// Agrupa notificaciones por día
function groupByDate(notifications: NotificationData[]): Record<string, NotificationData[]> {
  const groups: Record<string, NotificationData[]> = {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  for (const notification of notifications) {
    const date = new Date(notification.createdAt)
    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    let key: string
    if (notifDate.getTime() === today.getTime()) {
      key = "Today"
    } else if (notifDate.getTime() === yesterday.getTime()) {
      key = "Yesterday"
    } else if (notifDate >= weekAgo) {
      key = "This week"
    } else {
      key = "Older"
    }

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(notification)
  }

  return groups
}

interface NotificationListProps {
  initialNotifications: NotificationData[]
  initialHasMore: boolean
}

export function NotificationList({ initialNotifications, initialHasMore }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  async function handleLoadMore() {
    setLoading(true)
    const nextPage = page + 1
    const result = await getNotifications(nextPage)

    setNotifications([...notifications, ...result.notifications])
    setHasMore(result.hasMore)
    setPage(nextPage)
    setLoading(false)
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  async function handleMarkAsRead(notification: NotificationData) {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
    }
  }

  const grouped = groupByDate(notifications)
  const groupOrder = ["Today", "Yesterday", "This week", "Older"]

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        <p className="text-gray-500">No notifications yet</p>
        <p className="text-sm text-gray-400 mt-1">
          New videos from your subscriptions will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      {/* Grouped notifications */}
      {groupOrder.map(groupName => {
        const groupNotifications = grouped[groupName]
        if (!groupNotifications || groupNotifications.length === 0) return null

        return (
          <div key={groupName}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {groupName}
            </h2>
            <div className="space-y-2">
              {groupNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/watch/${notification.videoId}`}
                  onClick={() => handleMarkAsRead(notification)}
                  className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-32 h-20 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={notification.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {notification.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs bg-black/80 text-white rounded">
                        {formatDuration(notification.duration)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{notification.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.channelName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(new Date(notification.createdAt))}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-3 h-3 mt-1 bg-blue-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {/* Load more button */}
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
