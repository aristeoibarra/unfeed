import { exec } from "child_process"
import { promisify } from "util"
import { prisma } from "@/lib/db"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

// Configuration
const AUDIO_CACHE_DIR = process.env.AUDIO_CACHE_DIR || "./audio-cache"
const MAX_DISK_USAGE_GB = parseInt(process.env.MAX_AUDIO_CACHE_GB || "50")
const CLEANUP_DAYS = 30

// Validate YouTube video ID format (11 alphanumeric characters with hyphens and underscores)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export interface AudioFileInfo {
  videoId: string
  filePath: string
  fileSize: number
  status: "pending" | "downloading" | "ready" | "error"
  downloadedAt: Date
}

export type DownloadStatus = "none" | "pending" | "downloading" | "ready" | "error"

/**
 * Get the absolute path to the audio cache directory
 */
function getAudioCacheDir(): string {
  if (path.isAbsolute(AUDIO_CACHE_DIR)) {
    return AUDIO_CACHE_DIR
  }
  return path.join(process.cwd(), AUDIO_CACHE_DIR)
}

/**
 * Get the absolute path to an audio file
 */
export function getAudioFilePath(videoId: string): string {
  return path.join(getAudioCacheDir(), `${videoId}.mp3`)
}

/**
 * Check if audio file exists locally and is ready to serve
 */
export async function getLocalAudioFile(videoId: string): Promise<AudioFileInfo | null> {
  if (!VIDEO_ID_REGEX.test(videoId)) return null

  const audioFile = await prisma.audioFile.findUnique({
    where: { videoId },
  })

  if (!audioFile || audioFile.status !== "ready") {
    return null
  }

  // Verify file actually exists on disk
  const fullPath = getAudioFilePath(videoId)
  try {
    await fs.access(fullPath)
    return {
      videoId: audioFile.videoId,
      filePath: audioFile.filePath,
      fileSize: audioFile.fileSize,
      status: "ready",
      downloadedAt: audioFile.downloadedAt,
    }
  } catch {
    // File missing from disk, remove stale record
    await prisma.audioFile.delete({ where: { videoId } }).catch(() => {})
    return null
  }
}

/**
 * Download audio file using yt-dlp
 * Returns immediately if already downloading or ready
 */
export async function downloadAudioFile(videoId: string): Promise<AudioFileInfo> {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    throw new Error("Invalid video ID format")
  }

  // Check if already downloading or ready
  const existing = await prisma.audioFile.findUnique({ where: { videoId } })
  if (existing?.status === "downloading") {
    throw new Error("Download already in progress")
  }
  if (existing?.status === "ready") {
    // Verify file exists
    const fullPath = getAudioFilePath(videoId)
    try {
      await fs.access(fullPath)
      return {
        videoId: existing.videoId,
        filePath: existing.filePath,
        fileSize: existing.fileSize,
        status: "ready",
        downloadedAt: existing.downloadedAt,
      }
    } catch {
      // File missing, will re-download
    }
  }

  // Ensure cache directory exists
  const cacheDir = getAudioCacheDir()
  await fs.mkdir(cacheDir, { recursive: true })

  const filePath = `${videoId}.mp3`
  const fullPath = path.join(cacheDir, filePath)

  // Create/update record with "downloading" status
  await prisma.audioFile.upsert({
    where: { videoId },
    update: { status: "downloading", errorMessage: null },
    create: { videoId, filePath, fileSize: 0, status: "downloading" },
  })

  try {
    const cookiesPath = process.env.YT_DLP_COOKIES_PATH || "/home/ec2-user/cookies_youtube.txt"
    const ytdlpPath = process.env.YT_DLP_PATH || "/home/ec2-user/.local/bin/yt-dlp"

    // Download audio file as MP3
    const command = `${ytdlpPath} --cookies "${cookiesPath}" -f bestaudio -x --audio-format mp3 -o "${fullPath}" "https://youtube.com/watch?v=${videoId}"`

    await execAsync(command, {
      timeout: 300000, // 5 minute timeout for large files
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    })

    // Get file size
    const stats = await fs.stat(fullPath)
    const fileSize = stats.size

    // Verify file was created and has content
    if (fileSize === 0) {
      throw new Error("Downloaded file is empty")
    }

    // Update record with success
    await prisma.audioFile.update({
      where: { videoId },
      data: {
        status: "ready",
        fileSize,
        downloadedAt: new Date(),
        lastPlayedAt: new Date(),
      },
    })

    return {
      videoId,
      filePath,
      fileSize,
      status: "ready",
      downloadedAt: new Date(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    // Update record with error
    await prisma.audioFile.update({
      where: { videoId },
      data: { status: "error", errorMessage: message },
    })

    // Cleanup partial file if exists
    try {
      await fs.unlink(fullPath)
    } catch {}

    throw error
  }
}

/**
 * Update lastPlayedAt timestamp when audio is accessed
 */
export async function touchAudioFile(videoId: string): Promise<void> {
  await prisma.audioFile
    .updateMany({
      where: { videoId, status: "ready" },
      data: { lastPlayedAt: new Date() },
    })
    .catch(() => {})
}

/**
 * Get disk usage statistics for the audio cache
 */
export async function getDiskUsage(): Promise<{
  totalFiles: number
  totalSizeBytes: number
  totalSizeGB: number
  maxSizeGB: number
  usagePercent: number
}> {
  const result = await prisma.audioFile.aggregate({
    where: { status: "ready" },
    _count: true,
    _sum: { fileSize: true },
  })

  const totalBytes = result._sum.fileSize || 0
  const totalGB = totalBytes / (1024 * 1024 * 1024)

  return {
    totalFiles: result._count,
    totalSizeBytes: totalBytes,
    totalSizeGB: Math.round(totalGB * 100) / 100,
    maxSizeGB: MAX_DISK_USAGE_GB,
    usagePercent: Math.round((totalGB / MAX_DISK_USAGE_GB) * 100),
  }
}

/**
 * Cleanup old audio files (not played in 30+ days)
 */
export async function cleanupOldAudioFiles(): Promise<{
  deletedCount: number
  freedBytes: number
}> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS)

  // Find files to delete
  const oldFiles = await prisma.audioFile.findMany({
    where: {
      status: "ready",
      lastPlayedAt: { lt: cutoffDate },
    },
  })

  let deletedCount = 0
  let freedBytes = 0
  const cacheDir = getAudioCacheDir()

  for (const file of oldFiles) {
    try {
      const fullPath = path.join(cacheDir, file.filePath)
      await fs.unlink(fullPath)
      freedBytes += file.fileSize
      deletedCount++
    } catch {
      // File might already be deleted
    }
  }

  // Delete database records
  await prisma.audioFile.deleteMany({
    where: {
      status: "ready",
      lastPlayedAt: { lt: cutoffDate },
    },
  })

  // Also cleanup error records older than 7 days
  const errorCutoff = new Date()
  errorCutoff.setDate(errorCutoff.getDate() - 7)
  await prisma.audioFile.deleteMany({
    where: {
      status: "error",
      downloadedAt: { lt: errorCutoff },
    },
  })

  return { deletedCount, freedBytes }
}

/**
 * Get download status for a video
 */
export async function getDownloadStatus(videoId: string): Promise<{
  status: DownloadStatus
  errorMessage?: string
}> {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return { status: "none" }
  }

  const audioFile = await prisma.audioFile.findUnique({
    where: { videoId },
    select: { status: true, errorMessage: true },
  })

  if (!audioFile) {
    return { status: "none" }
  }

  return {
    status: audioFile.status as DownloadStatus,
    errorMessage: audioFile.errorMessage || undefined,
  }
}

/**
 * Check if disk usage is within limits before downloading
 */
export async function canDownload(): Promise<boolean> {
  const usage = await getDiskUsage()
  return usage.usagePercent < 90
}

/**
 * Delete a specific audio file
 */
export async function deleteAudioFile(videoId: string): Promise<boolean> {
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return false
  }

  const audioFile = await prisma.audioFile.findUnique({
    where: { videoId },
  })

  if (!audioFile) {
    return false
  }

  // Delete file from disk
  try {
    const fullPath = getAudioFilePath(videoId)
    await fs.unlink(fullPath)
  } catch {
    // File might not exist
  }

  // Delete database record
  await prisma.audioFile.delete({ where: { videoId } })

  return true
}
