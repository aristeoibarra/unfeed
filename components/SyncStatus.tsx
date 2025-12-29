"use client"

import { useTransition } from "react"
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
  Tv,
  Zap
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
  enabledChannelCount: number
  totalVideos: number
  quota: {
    dailyUnitsEstimate: number
    dailyQuota: number
    percentage: number
    syncsPerDay: number
  }
}

interface SyncStatusProps {
  summary: SyncSummary
  recentLogs: SyncLog[]
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <Check className="h-4 w-4 text-success" />
    case "partial":
      return <AlertTriangle className="h-4 w-4 text-warning" />
    case "error":
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    case "skipped":
      return <SkipForward className="h-4 w-4 text-muted-foreground" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-success"
    case "partial":
      return "text-warning"
    case "error":
      return "text-destructive"
    case "skipped":
      return "text-muted-foreground"
    default:
      return "text-muted-foreground"
  }
}

export function SyncStatus({ summary, recentLogs }: SyncStatusProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const logs = recentLogs
  const syncInfo = summary

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
          <div className="p-2 bg-info/10 rounded-lg">
            <Clock className="h-4 w-4 text-info" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last sync</p>
            <p className="text-sm font-medium">{lastSyncText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chart-4/10 rounded-lg">
            <RefreshCw className="h-4 w-4 text-chart-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Next auto sync</p>
            <p className="text-sm font-medium">{nextSyncText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <Tv className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Channels</p>
            <p className="text-sm font-medium">
              {syncInfo.enabledChannelCount}/{syncInfo.channelCount}
              <span className="text-xs text-muted-foreground ml-1">syncing</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Database className="h-4 w-4 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Videos cached</p>
            <p className="text-sm font-medium">{syncInfo.totalVideos.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quota estimate */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Estimated Daily API Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                syncInfo.quota.percentage > 80
                  ? "bg-destructive"
                  : syncInfo.quota.percentage > 50
                  ? "bg-warning"
                  : "bg-success"
              }`}
              style={{ width: `${Math.min(100, syncInfo.quota.percentage)}%` }}
            />
          </div>
          <span className="text-sm font-medium min-w-[45px] text-right">
            {syncInfo.quota.percentage}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ~{syncInfo.quota.dailyUnitsEstimate.toLocaleString()} / {syncInfo.quota.dailyQuota.toLocaleString()} units
          ({syncInfo.quota.syncsPerDay}x/day)
        </p>
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
          <h4 className="text-sm font-medium text-muted-foreground">
            Recent Sync Logs
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted"
              >
                {getStatusIcon(log.status)}
                <span className="text-muted-foreground min-w-[80px]">
                  {format(new Date(log.createdAt), "MMM d, HH:mm")}
                </span>
                <span className={`capitalize ${getStatusColor(log.status)}`}>
                  {log.type}
                </span>
                {log.status !== "skipped" && (
                  <span className="text-muted-foreground">
                    {log.channelsSynced} ch, {log.newVideos} new
                  </span>
                )}
                {log.status === "skipped" && (
                  <span className="text-muted-foreground italic">
                    Skipped (recent sync)
                  </span>
                )}
                {log.errors && log.status !== "skipped" && (
                  <span className="text-destructive text-xs">
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
