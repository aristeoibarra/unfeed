import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getSettings } from "@/actions/settings"
import { AddSubscription } from "@/components/AddSubscription"
import { SubscriptionListWithCategories } from "@/components/SubscriptionListWithCategories"
import { CategoryManager } from "@/components/CategoryManager"
import { SettingsToggle } from "@/components/SettingsToggle"

export default async function SubscriptionsPage() {
  const [subscriptions, categories, settings] = await Promise.all([
    getSubscriptions(),
    getCategories(),
    getSettings()
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscribed channels and categories
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Add Subscription</h2>
        <AddSubscription />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Categories</h2>
        </div>
        <CategoryManager categories={categories} />
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Your Subscriptions ({subscriptions.length})</h2>
        <SubscriptionListWithCategories
          subscriptions={subscriptions}
          categories={categories}
        />
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Settings</h2>
        <SettingsToggle initialHideDisliked={settings.hideDislikedFromFeed} />
      </div>
    </div>
  )
}
