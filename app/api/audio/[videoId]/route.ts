import { NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Validate YouTube video ID format (11 alphanumeric characters with hyphens and underscores)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

interface AudioResponse {
  url: string
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
    // Execute yt-dlp to get the audio stream URL
    // Using bestaudio format with m4a preference for better compatibility
    const { stdout, stderr } = await execAsync(
      `yt-dlp -f 'bestaudio[ext=m4a]/bestaudio' --get-url "https://youtube.com/watch?v=${videoId}"`,
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

    // Return the audio stream URL
    return NextResponse.json({ url: audioUrl })
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
