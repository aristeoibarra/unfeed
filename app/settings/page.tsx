import { getSettings } from "@/actions/settings"
import { getCategories } from "@/actions/categories"
import { getSyncSummary, getSyncLogs } from "@/actions/sync"
import { SettingsToggle } from "@/components/SettingsToggle"
import { TimeLimitSettings } from "@/components/TimeLimitSettings"
import { ClearHistoryButton } from "@/components/ClearHistoryButton"
import { CategoryManager } from "@/components/CategoryManager"
import { SyncStatus } from "@/components/SyncStatus"
import { SyncIntervalSettings } from "@/components/SyncIntervalSettings"
import { LanguageSettings } from "@/components/LanguageSettings"
import { Settings, FolderOpen, RefreshCw, Languages } from "lucide-react"

export const metadata = {
  title: "Settings - Unfeed",
  description: "Manage your Unfeed preferences"
}

export default async function SettingsPage() {
  const [settings, categories, syncSummary, syncLogs] = await Promise.all([
    getSettings(),
    getCategories(),
    getSyncSummary(),
    getSyncLogs(5)
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <header className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your preferences and categories
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Sync Status */}
        <section className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sync Status</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View sync history and trigger manual sync
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <SyncIntervalSettings initialInterval={settings.syncIntervalHours} />
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <SyncStatus summary={syncSummary} recentLogs={syncLogs} />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FolderOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Categories</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organize your channels into groups
              </p>
            </div>
          </div>
          <CategoryManager categories={categories} />
        </section>

        {/* Player Settings */}
        <section className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Languages className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Player</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Language and subtitle preferences
              </p>
            </div>
          </div>
          <LanguageSettings
            initialLanguage={settings.preferredLanguage}
            initialAutoShowSubtitles={settings.autoShowSubtitles}
          />
        </section>

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
