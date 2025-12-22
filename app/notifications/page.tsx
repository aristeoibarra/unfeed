import { getNotifications, markAllAsRead } from "@/actions/notifications"
import { NotificationList } from "@/components/NotificationList"
import Link from "next/link"

export const metadata = {
  title: "Notifications - Unfeed",
}

export default async function NotificationsPage() {
  const result = await getNotifications(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Notifications
          {result.unreadCount > 0 && (
            <span className="ml-2 text-lg font-normal text-gray-500">
              ({result.unreadCount} unread)
            </span>
          )}
        </h1>
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to feed
        </Link>
      </div>

      <NotificationList
        initialNotifications={result.notifications}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
