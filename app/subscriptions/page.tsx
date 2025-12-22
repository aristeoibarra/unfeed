import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { getSettings } from "@/actions/settings"
import { AddSubscription } from "@/components/AddSubscription"
import { SubscriptionListWithCategories } from "@/components/SubscriptionListWithCategories"
import { CategoryManager } from "@/components/CategoryManager"
import { SettingsToggle } from "@/components/SettingsToggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderOpen, Settings, Plus } from "lucide-react"

export default async function SubscriptionsPage() {
  const [subscriptions, categories, settings] = await Promise.all([
    getSubscriptions(),
    getCategories(),
    getSettings()
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your channels, categories, and preferences
        </p>
      </header>

      {/* Add subscription section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Add Subscription</CardTitle>
              <CardDescription>
                Add a new YouTube channel to your feed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AddSubscription />
        </CardContent>
      </Card>

      {/* Categories section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FolderOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Organize your subscriptions into groups
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>

      {/* Subscriptions list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>
                Your Subscriptions
                {subscriptions.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({subscriptions.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                All the channels you follow
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SubscriptionListWithCategories
            subscriptions={subscriptions}
            categories={categories}
          />
        </CardContent>
      </Card>

      {/* Settings section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize how your feed works
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SettingsToggle initialHideDisliked={settings.hideDislikedFromFeed} />
        </CardContent>
      </Card>
    </div>
  )
}
