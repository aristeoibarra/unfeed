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
import {
  Settings,
  FolderOpen,
  RefreshCw,
  Languages,
  Rss,
  Clock,
  Database,
  AlertTriangle
} from "lucide-react"

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
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex items-center gap-4">
        <div className="p-3 bg-muted rounded-xl">
          <Settings className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your preferences and categories
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Sync Status */}
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-info/10 rounded-lg">
              <RefreshCw className="h-5 w-5 text-info" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sync Status</h2>
              <p className="text-sm text-muted-foreground">
                View sync history and trigger manual sync
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <SyncIntervalSettings initialInterval={settings.syncIntervalHours} />
            <div className="border-t border-border pt-4">
              <SyncStatus summary={syncSummary} recentLogs={syncLogs} />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-chart-4/10 rounded-lg">
              <FolderOpen className="h-5 w-5 text-chart-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Categories</h2>
              <p className="text-sm text-muted-foreground">
                Organize your channels into groups
              </p>
            </div>
          </div>
          <CategoryManager categories={categories} />
        </section>

        {/* Player Settings */}
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Languages className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Player</h2>
              <p className="text-sm text-muted-foreground">
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
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <Rss className="h-5 w-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Feed</h2>
              <p className="text-sm text-muted-foreground">
                Customize how videos appear in your feed
              </p>
            </div>
          </div>
          <SettingsToggle initialHideDisliked={settings.hideDislikedFromFeed} />
        </section>

        {/* Time Limits */}
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 text-warning" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Time Limits</h2>
              <p className="text-sm text-muted-foreground">
                Manage your screen time with daily and weekly limits
              </p>
            </div>
          </div>
          <TimeLimitSettings
            initialDailyLimit={settings.dailyLimitMinutes}
            initialWeeklyLimit={settings.weeklyLimitMinutes}
          />
        </section>

        {/* Data Management */}
        <section className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg">
              <Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Data</h2>
              <p className="text-sm text-muted-foreground">
                Manage your watch history and data
              </p>
            </div>
          </div>

          {/* Danger zone */}
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Danger Zone</span>
            </div>
            <ClearHistoryButton />
          </div>
        </section>
      </div>
    </div>
  )
}
