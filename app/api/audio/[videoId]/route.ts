import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { prisma } from "@/lib/db"
import {
  getLocalAudioFile,
  downloadAudioFile,
  touchAudioFile,
  canDownload,
} from "@/lib/audio-cache"

const execAsync = promisify(exec)

// Validate YouTube video ID format (11 alphanumeric characters with hyphens and underscores)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

// Cache TTL: 5 hours in milliseconds
const CACHE_TTL_MS = 5 * 60 * 60 * 1000

interface AudioResponse {
  type: "local" | "stream"
  url: string
  cached?: boolean
  downloading?: boolean
}

interface ErrorResponse {
  error: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
): Promise<NextResponse<AudioResponse | ErrorResponse>> {
  const { videoId } = await params

  // Validate videoId to prevent command injection
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return NextResponse.json(
      { error: "Invalid video ID format" },
      { status: 400 }
    )
  }

  try {
    // 1. Check for local file first (instant playback)
    const localFile = await getLocalAudioFile(videoId)

    if (localFile) {
      // Update last played timestamp
      touchAudioFile(videoId).catch(() => {})

      return NextResponse.json({
        type: "local",
        url: `/api/audio/${videoId}/file`,
        cached: true,
      })
    }

    // 2. Start background download if disk space available
    let downloading = false
    if (await canDownload()) {
      downloadAudioFile(videoId).catch(() => {
        // Silent fail for background download - not critical for playback
      })
      downloading = true
    }

    // 3. Check URL cache for stream URL
    const cached = await prisma.audioCache.findUnique({
      where: { videoId },
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({
        type: "stream",
        url: cached.audioUrl,
        cached: true,
        downloading,
      })
    }

    // 4. Execute yt-dlp to get the audio stream URL
    const cookiesPath = process.env.YT_DLP_COOKIES_PATH || "/home/ec2-user/cookies_youtube.txt"
    const ytdlpPath = process.env.YT_DLP_PATH || "/home/ec2-user/.local/bin/yt-dlp"

    const { stdout, stderr } = await execAsync(
      `${ytdlpPath} --cookies "${cookiesPath}" -f '140/bestaudio[ext=m4a]/bestaudio' --extractor-args "youtube:player_client=web" --get-url "https://youtube.com/watch?v=${videoId}"`,
      {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      }
    )

    const audioUrl = stdout.trim()

    if (!audioUrl) {
      console.error("yt-dlp stderr:", stderr)
      return NextResponse.json(
        { error: "Failed to extract audio URL" },
        { status: 500 }
      )
    }

    // Save to cache with 5-hour TTL
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
    await prisma.audioCache.upsert({
      where: { videoId },
      update: { audioUrl, expiresAt },
      create: { videoId, audioUrl, expiresAt },
    })

    // Return the audio stream URL
    return NextResponse.json({
      type: "stream",
      url: audioUrl,
      cached: false,
      downloading,
    })
  } catch (error) {
    console.error("Error executing yt-dlp:", error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 504 }
        )
      }

      if (error.message.includes("command not found") || error.message.includes("ENOENT")) {
        return NextResponse.json(
          { error: "yt-dlp is not installed on the server" },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to get audio stream" },
      { status: 500 }
    )
  }
}
