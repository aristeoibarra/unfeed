"use client"

import { useState, useEffect } from "react"
import { getAudioDownloadStatus } from "@/actions/audio"
import { cn } from "@/lib/utils"
import { Download, Check, Loader2, AlertCircle, Cloud } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AudioDownloadStatusProps {
  videoId: string
  className?: string
}

export function AudioDownloadStatus({
  videoId,
  className,
}: AudioDownloadStatusProps) {
  const [status, setStatus] = useState<
    "none" | "pending" | "downloading" | "ready" | "error"
  >("none")
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let mounted = true
    let intervalId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      try {
        const result = await getAudioDownloadStatus(videoId)
        if (mounted) {
          setStatus(result.status)
          setError(result.error)
        }
      } catch {
        // Ignore errors during status check
      }
    }

    checkStatus()

    // Poll while downloading or pending
    if (status === "downloading" || status === "pending") {
      intervalId = setInterval(checkStatus, 3000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [videoId, status])

  const statusConfig: Record<
    string,
    {
      icon: typeof Cloud
      label: string
      shortLabel: string
      color: string
      animate?: boolean
    }
  > = {
    none: {
      icon: Cloud,
      label: "Streaming from YouTube",
      shortLabel: "",
      color: "text-[var(--muted-foreground)]",
    },
    pending: {
      icon: Download,
      label: "Preparing download...",
      shortLabel: "",
      color: "text-warning",
    },
    downloading: {
      icon: Loader2,
      label: "Downloading to cache...",
      shortLabel: "Caching...",
      color: "text-info",
      animate: true,
    },
    ready: {
      icon: Check,
      label: "Cached locally for instant playback",
      shortLabel: "Cached",
      color: "text-success",
    },
    error: {
      icon: AlertCircle,
      label: error || "Download failed",
      shortLabel: "Error",
      color: "text-destructive",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  // Don't show anything if status is "none" (streaming is the default)
  if (status === "none") {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("inline-flex items-center gap-1.5", className)}
            role="status"
            aria-label={config.label}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                config.color,
                config.animate && "animate-spin"
              )}
              aria-hidden="true"
            />
            {config.shortLabel && (
              <span className={cn("text-xs", config.color)}>
                {config.shortLabel}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
