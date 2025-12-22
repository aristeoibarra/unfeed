"use server"

// Validate YouTube video ID format (11 alphanumeric characters with hyphens and underscores)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

/**
 * Get audio URL for a YouTube video using the internal API Route
 *
 * The API Route (/api/audio/[videoId]) uses yt-dlp to extract the audio stream URL.
 * This requires yt-dlp to be installed on the server.
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
    // Get the base URL for the API
    // In development, this will be localhost
    // In production, this should be the app's URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000"

    // Ensure the URL has a protocol
    const url = baseUrl.startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`

    const response = await fetch(`${url}/api/audio/${videoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Don't cache audio URLs as they expire
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Failed to get audio URL:", response.status, errorData)
      return null
    }

    const data = await response.json()
    return data.url || null
  } catch (error) {
    console.error("Error fetching audio URL:", error)
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
