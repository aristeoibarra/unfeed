"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Bell } from "lucide-react"
import { getUnreadCount, getRecentNotifications, markAsRead, markAllAsRead, type NotificationData } from "@/actions/notifications"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks/useMediaQuery"

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count}${interval.label}`
    }
  }

  return "now"
}

interface NotificationBellProps {
  initialCount: number
  initialNotifications: NotificationData[]
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationData
  onClick: () => void
}) {
  return (
    <Link
      href={`/watch/${notification.videoId}`}
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div className="relative flex-shrink-0 w-24 h-14 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
        <Image
          src={notification.thumbnail}
          alt=""
          fill
          className="object-cover"
          sizes="96px"
        />
        {notification.duration && (
          <span className="absolute bottom-0.5 right-0.5 px-1 text-[10px] bg-black/80 text-white rounded">
            {formatDuration(notification.duration)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2">{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {notification.channelName} &middot; {getTimeAgo(new Date(notification.createdAt))}
        </p>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
      )}
    </Link>
  )
}

function NotificationList({
  notifications,
  count,
  onMarkAllRead,
  onNotificationClick,
  onClose,
}: {
  notifications: NotificationData[]
  count: number
  onMarkAllRead: () => void
  onNotificationClick: (notification: NotificationData) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold">Notifications</span>
        {count > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <ScrollArea className="max-h-80">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => {
                onNotificationClick(notification)
                onClose()
              }}
            />
          ))
        )}
      </ScrollArea>
      <Link
        href="/notifications"
        onClick={onClose}
        className="block px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        View all notifications
      </Link>
    </>
  )
}

export function NotificationBell({ initialCount, initialNotifications }: NotificationBellProps) {
  const [count, setCount] = useState(initialCount)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const newCount = await getUnreadCount()
        setCount(newCount)
        const recent = await getRecentNotifications(5)
        setNotifications(recent)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  async function handleMarkAllAsRead() {
    await markAllAsRead()
    setCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  async function handleNotificationClick(notification: NotificationData) {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      setCount(prev => Math.max(0, prev - 1))
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
    }
  }

  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-11 w-11 rounded-full"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  )

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {bellButton}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <NotificationList
            notifications={notifications}
            count={count}
            onMarkAllRead={handleMarkAllAsRead}
            onNotificationClick={handleNotificationClick}
            onClose={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {bellButton}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Notifications</DrawerTitle>
        </DrawerHeader>
        <NotificationList
          notifications={notifications}
          count={count}
          onMarkAllRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
          onClose={() => setIsOpen(false)}
        />
      </DrawerContent>
    </Drawer>
  )
}
