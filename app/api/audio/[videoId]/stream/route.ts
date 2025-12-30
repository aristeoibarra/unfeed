import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { prisma } from "@/lib/db"
import {
  getLocalAudioFile,
  getAudioFilePath,
  touchAudioFile,
} from "@/lib/audio-cache"
import fs from "fs"
import { stat } from "fs/promises"

const execAsync = promisify(exec)

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/
const CACHE_TTL_MS = 5 * 60 * 60 * 1000

/**
 * Get fresh audio URL from yt-dlp
 */
async function getFreshAudioUrl(videoId: string): Promise<string | null> {
  const cookiesPath = process.env.YT_DLP_COOKIES_PATH || "/home/ec2-user/cookies_youtube.txt"
  const ytdlpPath = process.env.YT_DLP_PATH || "/home/ec2-user/.local/bin/yt-dlp"

  try {
    const { stdout, stderr } = await execAsync(
      `${ytdlpPath} --cookies "${cookiesPath}" -f 'bestaudio[ext=m4a]/bestaudio/93/best' --get-url "https://youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, maxBuffer: 1024 * 1024 }
    )

    const audioUrl = stdout.trim()

    if (!audioUrl) {
      console.error("yt-dlp stderr:", stderr)
      return null
    }

    // Cache the URL
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS)
    await prisma.audioCache.upsert({
      where: { videoId },
      update: { audioUrl, expiresAt },
      create: { videoId, audioUrl, expiresAt },
    })

    return audioUrl
  } catch (error) {
    console.error("yt-dlp error:", error)
    return null
  }
}

/**
 * Stream local file directly (no redirect)
 */
async function streamLocalFile(
  request: NextRequest,
  videoId: string
): Promise<NextResponse> {
  const fullPath = getAudioFilePath(videoId)
  const fileStat = await stat(fullPath)
  const fileSize = fileStat.size

  // Update last played timestamp
  touchAudioFile(videoId).catch(() => {})

  const range = request.headers.get("range")

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    const stream = fs.createReadStream(fullPath, { start, end })
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk))
        stream.on("end", () => controller.close())
        stream.on("error", (err) => controller.error(err))
      },
      cancel() {
        stream.destroy()
      },
    })

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    })
  }

  // Full file
  const stream = fs.createReadStream(fullPath)
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk))
      stream.on("end", () => controller.close())
      stream.on("error", (err) => controller.error(err))
    },
    cancel() {
      stream.destroy()
    },
  })

  return new NextResponse(webStream, {
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000",
    },
  })
}

/**
 * Proxy stream from YouTube URL
 */
async function proxyStream(
  request: NextRequest,
  audioUrl: string
): Promise<NextResponse | null> {
  const range = request.headers.get("range")
  const headers: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  }

  if (range) {
    headers["Range"] = range
  }

  const response = await fetch(audioUrl, { headers })

  // Return null if URL expired (403/410) so caller can retry with fresh URL
  if (response.status === 403 || response.status === 410) {
    return null
  }

  if (!response.ok && response.status !== 206) {
    console.error("Upstream error:", response.status, response.statusText)
    return new NextResponse(`Upstream error: ${response.status}`, { status: response.status })
  }

  const contentType = response.headers.get("content-type") || "audio/mp4"
  const contentLength = response.headers.get("content-length")
  const contentRange = response.headers.get("content-range")
  const acceptRanges = response.headers.get("accept-ranges")

  const responseHeaders: HeadersInit = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  }

  if (contentLength) responseHeaders["Content-Length"] = contentLength
  if (contentRange) responseHeaders["Content-Range"] = contentRange
  if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

/**
 * Proxy endpoint that streams audio from YouTube
 * This avoids CORS issues by fetching on the server side
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
): Promise<NextResponse> {
  const { videoId } = await params

  if (!VIDEO_ID_REGEX.test(videoId)) {
    return new NextResponse("Invalid video ID", { status: 400 })
  }

  try {
    // 1. Check for local file first - stream directly (no redirect)
    const localFile = await getLocalAudioFile(videoId)
    if (localFile) {
      return streamLocalFile(request, videoId)
    }

    // 2. Try cached URL first
    const cached = await prisma.audioCache.findUnique({
      where: { videoId },
    })

    if (cached && cached.expiresAt > new Date()) {
      const result = await proxyStream(request, cached.audioUrl)

      // If proxy succeeded, return it
      if (result) {
        return result
      }

      // If null, URL expired - fall through to get fresh URL
      console.log("Cached URL expired for", videoId, "- getting fresh URL")
    }

    // 3. Get fresh URL from yt-dlp
    const freshUrl = await getFreshAudioUrl(videoId)

    if (!freshUrl) {
      return new NextResponse("Failed to get audio URL from yt-dlp", { status: 500 })
    }

    // 4. Proxy the fresh URL
    const result = await proxyStream(request, freshUrl)

    if (!result) {
      return new NextResponse("Fresh URL also failed - YouTube may be blocking", { status: 502 })
    }

    return result
  } catch (error) {
    console.error("Stream proxy error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return new NextResponse(`Stream error: ${message}`, { status: 500 })
  }
}
