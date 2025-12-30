"use client"

import { useState, useEffect } from "react"
import { triggerAudioDownload, getAudioDownloadStatus } from "@/actions/audio"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Download, Check, Loader2, HardDrive } from "lucide-react"

interface AudioDownloadButtonProps {
  videoId: string
  className?: string
}

export function AudioDownloadButton({ videoId, className }: AudioDownloadButtonProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<"none" | "pending" | "downloading" | "ready" | "error">("none")
  const [isLoading, setIsLoading] = useState(false)

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      const result = await getAudioDownloadStatus(videoId)
      setStatus(result.status)
    }
    checkStatus()
  }, [videoId])

  // Poll while downloading
  useEffect(() => {
    if (status !== "downloading" && status !== "pending") return

    const interval = setInterval(async () => {
      const result = await getAudioDownloadStatus(videoId)
      setStatus(result.status)

      if (result.status === "ready") {
        toast({
          title: "Audio cached",
          description: "Audio file saved locally for instant playback",
        })
      } else if (result.status === "error") {
        toast({
          title: "Download failed",
          description: result.error || "Could not download audio",
          variant: "destructive",
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status, videoId, toast])

  const handleDownload = async () => {
    if (status === "ready" || status === "downloading") return

    setIsLoading(true)
    try {
      const result = await triggerAudioDownload(videoId)

      if (result.success) {
        setStatus(result.status)
        if (result.status === "downloading") {
          toast({
            title: "Download started",
            description: "Audio file is being cached for offline playback",
          })
        } else if (result.status === "ready") {
          toast({
            title: "Already cached",
            description: "Audio file is already saved locally",
          })
        }
      } else {
        toast({
          title: "Download failed",
          description: result.error || "Could not start download",
          variant: "destructive",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isDownloading = status === "downloading" || status === "pending"
  const isReady = status === "ready"

  return (
    <Button
      variant={isReady ? "secondary" : "outline"}
      size="sm"
      onClick={handleDownload}
      disabled={isLoading || isDownloading || isReady}
      className={cn("gap-2", className)}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Caching...</span>
        </>
      ) : isReady ? (
        <>
          <Check className="h-4 w-4 text-success" />
          <span>Cached</span>
        </>
      ) : (
        <>
          <HardDrive className="h-4 w-4" />
          <span>Cache audio</span>
        </>
      )}
    </Button>
  )
}
