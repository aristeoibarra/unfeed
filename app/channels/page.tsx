import { getSubscriptions } from "@/actions/subscriptions"
import { getCategories } from "@/actions/categories"
import { AddSubscription } from "@/components/AddSubscription"
import { SubscriptionListWithCategories } from "@/components/SubscriptionListWithCategories"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus } from "lucide-react"

export const metadata = {
  title: "Channels - Unfeed",
  description: "Manage your YouTube channel subscriptions"
}

export default async function ChannelsPage() {
  const [subscriptions, categories] = await Promise.all([
    getSubscriptions(),
    getCategories()
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your YouTube subscriptions
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

      {/* Channels list */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>
                Your Channels
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
    </div>
  )
}
