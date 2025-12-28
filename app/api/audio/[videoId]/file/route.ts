import { NextRequest, NextResponse } from "next/server"
import { getLocalAudioFile, touchAudioFile, getAudioFilePath } from "@/lib/audio-cache"
import fs from "fs"
import { stat } from "fs/promises"

// Validate YouTube video ID format
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
): Promise<NextResponse> {
  const { videoId } = await params

  if (!VIDEO_ID_REGEX.test(videoId)) {
    return new NextResponse("Invalid video ID", { status: 400 })
  }

  try {
    const localFile = await getLocalAudioFile(videoId)

    if (!localFile) {
      return new NextResponse("Audio file not found", { status: 404 })
    }

    // Update last played timestamp (fire and forget)
    touchAudioFile(videoId).catch(() => {})

    const fullPath = getAudioFilePath(videoId)
    const fileStat = await stat(fullPath)
    const fileSize = fileStat.size

    // Support range requests for seeking
    const range = request.headers.get("range")

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const stream = fs.createReadStream(fullPath, { start, end })

      // Convert Node.js stream to Web ReadableStream
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
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        },
      })
    }

    // Full file request
    const stream = fs.createReadStream(fullPath)

    // Convert Node.js stream to Web ReadableStream
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
  } catch (error) {
    console.error("Error serving audio file:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
