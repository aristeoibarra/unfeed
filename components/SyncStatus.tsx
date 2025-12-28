"use client"

import { useState, useTransition } from "react"
import { syncVideos } from "@/actions/sync"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  RefreshCw,
  Check,
  AlertTriangle,
  Clock,
  SkipForward,
  Loader2,
  Database,
  Tv
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface SyncLog {
  id: number
  type: string
  status: string
  channelsSynced: number
  newVideos: number
  apiUnitsUsed: number
  errors: string | null
  duration: number
  triggeredBy: string
  createdAt: Date
}

interface SyncSummary {
  lastSync: SyncLog | null
  nextAutoSync: Date | null
  channelCount: number
  totalVideos: number
}

interface SyncStatusProps {
  summary: SyncSummary
  recentLogs: SyncLog[]
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <Check className="h-4 w-4 text-green-500" />
    case "partial":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "error":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "skipped":
      return <SkipForward className="h-4 w-4 text-gray-400" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-green-600 dark:text-green-400"
    case "partial":
      return "text-yellow-600 dark:text-yellow-400"
    case "error":
      return "text-red-600 dark:text-red-400"
    case "skipped":
      return "text-gray-500 dark:text-gray-400"
    default:
      return "text-gray-500 dark:text-gray-400"
  }
}

export function SyncStatus({ summary, recentLogs }: SyncStatusProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [logs, setLogs] = useState(recentLogs)
  const [syncInfo, setSyncInfo] = useState(summary)

  async function handleSync() {
    startTransition(async () => {
      const result = await syncVideos()

      if (result.success) {
        toast({
          title: "Sync completed",
          description: result.message
        })
        // Refresh page to get updated data
        window.location.reload()
      } else {
        toast({
          title: "Sync failed",
          description: result.message,
          variant: "destructive"
        })
      }
    })
  }

  const lastSyncText = syncInfo.lastSync
    ? `${formatDistanceToNow(new Date(syncInfo.lastSync.createdAt))} ago (${syncInfo.lastSync.type})`
    : "Never"

  const nextSyncText = syncInfo.nextAutoSync
    ? `in ${formatDistanceToNow(new Date(syncInfo.nextAutoSync))}`
    : "Due now"

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last sync</p>
            <p className="text-sm font-medium">{lastSyncText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Next auto sync</p>
            <p className="text-sm font-medium">{nextSyncText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Tv className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Channels</p>
            <p className="text-sm font-medium">{syncInfo.channelCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Videos cached</p>
            <p className="text-sm font-medium">{syncInfo.totalVideos.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Sync button */}
      <Button
        onClick={handleSync}
        disabled={isPending}
        className="w-full"
        variant="outline"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </>
        )}
      </Button>

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Recent Sync Logs
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                {getStatusIcon(log.status)}
                <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">
                  {format(new Date(log.createdAt), "MMM d, HH:mm")}
                </span>
                <span className={`capitalize ${getStatusColor(log.status)}`}>
                  {log.type}
                </span>
                {log.status !== "skipped" && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {log.channelsSynced} ch, {log.newVideos} new
                  </span>
                )}
                {log.status === "skipped" && (
                  <span className="text-gray-400 dark:text-gray-500 italic">
                    Skipped (recent sync)
                  </span>
                )}
                {log.errors && log.status !== "skipped" && (
                  <span className="text-red-500 text-xs">
                    ({JSON.parse(log.errors).length} errors)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
