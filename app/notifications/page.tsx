import { getNotifications } from "@/actions/notifications"
import { NotificationList } from "@/components/NotificationList"

export const metadata = {
  title: "Notifications - Unfeed",
}

export default async function NotificationsPage() {
  const result = await getNotifications(1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Notifications
        {result.unreadCount > 0 && (
          <span className="ml-2 text-lg font-normal text-muted-foreground">
            ({result.unreadCount} unread)
          </span>
        )}
      </h1>

      <NotificationList
        initialNotifications={result.notifications}
        initialHasMore={result.hasMore}
      />
    </div>
  )
}
