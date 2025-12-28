import { getSettings } from "@/actions/settings"
import { SettingsToggle } from "@/components/SettingsToggle"
import { TimeLimitSettings } from "@/components/TimeLimitSettings"
import { ClearHistoryButton } from "@/components/ClearHistoryButton"
import { Settings } from "lucide-react"

export const metadata = {
  title: "Settings - Unfeed",
  description: "Manage your Unfeed preferences"
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your preferences
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Feed Settings */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Feed</h2>
          <SettingsToggle initialHideDisliked={settings.hideDislikedFromFeed} />
        </section>

        {/* Time Limits */}
        <section className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <TimeLimitSettings
            initialDailyLimit={settings.dailyLimitMinutes}
            initialWeeklyLimit={settings.weeklyLimitMinutes}
          />
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Data</h2>
          <ClearHistoryButton />
        </section>
      </div>
    </div>
  )
}
