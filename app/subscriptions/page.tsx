import { getSubscriptions } from "@/actions/subscriptions"
import { AddSubscription } from "@/components/AddSubscription"
import { SubscriptionList } from "@/components/SubscriptionList"

export default async function SubscriptionsPage() {
  const subscriptions = await getSubscriptions()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscribed channels
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Add Subscription</h2>
        <AddSubscription />
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Your Subscriptions ({subscriptions.length})</h2>
        <SubscriptionList subscriptions={subscriptions} />
      </div>
    </div>
  )
}
