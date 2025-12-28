"use server"

import { exec } from "child_process"
import { promisify } from "util"
import { prisma } from "@/lib/db"
import {
  getLocalAudioFile,
  downloadAudioFile,
  getDownloadStatus,
  getDiskUsage,
  canDownload,
  type DownloadStatus,
} from "@/lib/audio-cache"

const execAsync = promisify(exec)

// Validate YouTube video ID format (11 alphanumeric characters with hyphens and underscores)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

// Cache TTL: 5 hours in milliseconds
const CACHE_TTL_MS = 5 * 60 * 60 * 1000

/**
 * Get audio URL for a YouTube video using yt-dlp directly
 *
 * This requires yt-dlp to be installed on the server.
 * Results are cached for 5 hours to reduce yt-dlp calls.
 *
 * @param videoId - YouTube video ID (11 characters)
 * @returns Audio stream URL or null if unavailable
 */
export async function getAudioUrl(videoId: string): Promise<string | null> {
  // Validate videoId format
  if (!VIDEO_ID_REGEX.test(videoId)) {
    console.error("Invalid video ID format:", videoId)
    return null
  }

  try {
    // Check cache first
    const cached = await prisma.audioCache.findUnique({
      where: { videoId },
    })

    if (cached && cached.expiresAt > new Date()) {
      return cached.audioUrl
    }

    // Path to cookies file and yt-dlp binary
    const cookiesPath = process.env.YT_DLP_COOKIES_PATH || "/home/ec2-user/cookies_youtube.txt"
    const ytdlpPath = process.env.YT_DLP_PATH || "/home/ec2-user/.local/bin/yt-dlp"

    // Execute yt-dlp directly to get the audio/video stream URL
    // Using format 93 (360p mp4 with audio) as fallback since bestaudio may not be available
    const { stdout, stderr } = await execAsync(
      `${ytdlpPath} --cookies "${cookiesPath}" -f 'bestaudio/93/best' --get-url "https://youtube.com/watch?v=${videoId}"`,
      {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      }
    )

    const audioUrl = stdout.trim()

    if (!audioUrl) {
      console.error("yt-dlp stderr:", stderr)
      return null
    }

    // Save to cache with 5-hour TTL
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
    await prisma.audioCache.upsert({
      where: { videoId },
      update: { audioUrl, expiresAt },
      create: { videoId, audioUrl, expiresAt },
    })

    return audioUrl
  } catch (error) {
    console.error("Error executing yt-dlp:", error)
    return null
  }
}

/**
 * Check if audio mode is available
 *
 * Audio mode requires yt-dlp to be installed on the server.
 * This function checks if the audio API route is accessible and working.
 *
 * @returns true if audio mode is available
 */
export async function isAudioModeAvailable(): Promise<boolean> {
  // Check if we're in development or if audio is explicitly enabled
  // In production, you might want to add an environment variable to enable/disable this feature
  const isEnabled = process.env.ENABLE_AUDIO_MODE !== "false"

  if (!isEnabled) {
    return false
  }

  // For simplicity, we assume audio mode is available if not explicitly disabled
  // The actual availability check happens when getAudioUrl is called
  // and will return null if yt-dlp is not installed
  return true
}

/**
 * Check if yt-dlp is installed and working on the server
 *
 * This performs an actual check by trying to get the version of yt-dlp.
 * Use this for health checks or admin status pages.
 *
 * @returns Object with availability status and version if available
 */
export async function checkYtDlpStatus(): Promise<{
  available: boolean
  version?: string
  error?: string
}> {
  try {
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)

    const { stdout } = await execAsync("yt-dlp --version", {
      timeout: 5000,
    })

    return {
      available: true,
      version: stdout.trim(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    if (message.includes("command not found") || message.includes("ENOENT")) {
      return {
        available: false,
        error: "yt-dlp is not installed",
      }
    }

    return {
      available: false,
      error: message,
    }
  }
}

/**
 * Get audio URL - prefers local file, falls back to stream
 * Starts background download if file not cached locally
 */
export async function getAudioWithLocalPreference(videoId: string): Promise<{
  url: string
  type: "local" | "stream"
  downloading: boolean
} | null> {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return null
  }

  try {
    // Check local file first
    const localFile = await getLocalAudioFile(videoId)

    if (localFile) {
      return {
        url: `/api/audio/${videoId}/file`,
        type: "local",
        downloading: false,
      }
    }

    // Start background download if disk space available
    let downloading = false
    if (await canDownload()) {
      downloadAudioFile(videoId).catch(() => {})
      downloading = true
    }

    // Return stream URL for immediate playback
    const streamUrl = await getAudioUrl(videoId)

    if (!streamUrl) return null

    return {
      url: streamUrl,
      type: "stream",
      downloading,
    }
  } catch (error) {
    console.error("Error getting audio:", error)
    return null
  }
}

/**
 * Trigger audio download without waiting for completion
 */
export async function triggerAudioDownload(videoId: string): Promise<{
  success: boolean
  status: DownloadStatus
  error?: string
}> {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return { success: false, status: "error", error: "Invalid video ID" }
  }

  try {
    const current = await getDownloadStatus(videoId)

    if (current.status === "ready") {
      return { success: true, status: "ready" }
    }

    if (current.status === "downloading") {
      return { success: true, status: "downloading" }
    }

    // Check disk space
    if (!(await canDownload())) {
      return { success: false, status: "error", error: "Disk space limit reached" }
    }

    // Start download in background
    downloadAudioFile(videoId).catch(() => {})

    return { success: true, status: "downloading" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, status: "error", error: message }
  }
}

/**
 * Get download status for UI polling
 */
export async function getAudioDownloadStatus(videoId: string): Promise<{
  status: DownloadStatus
  error?: string
}> {
  return getDownloadStatus(videoId)
}

/**
 * Get cache statistics for monitoring
 */
export async function getAudioCacheStats(): Promise<{
  totalFiles: number
  totalSizeGB: number
  maxSizeGB: number
  usagePercent: number
}> {
  const stats = await getDiskUsage()
  return {
    totalFiles: stats.totalFiles,
    totalSizeGB: stats.totalSizeGB,
    maxSizeGB: stats.maxSizeGB,
    usagePercent: stats.usagePercent,
  }
}
