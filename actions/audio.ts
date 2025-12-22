"use server"

/**
 * Get audio URL for a YouTube video
 *
 * NOTE: This requires a backend service with yt-dlp or similar tool.
 * For now, this is a placeholder that returns null.
 *
 * To implement:
 * 1. Set up a backend endpoint that runs yt-dlp
 * 2. Call that endpoint here to get the audio stream URL
 * 3. Return the URL for client-side playback
 *
 * Example yt-dlp command:
 * yt-dlp -f 'bestaudio[ext=m4a]/bestaudio' --get-url "https://youtube.com/watch?v=VIDEO_ID"
 */
export async function getAudioUrl(videoId: string): Promise<string | null> {
  // Placeholder - implement with yt-dlp backend
  console.log(`Audio URL requested for video: ${videoId}`)

  // Option 1: Use environment variable for backend URL
  const AUDIO_BACKEND_URL = process.env.AUDIO_BACKEND_URL

  if (AUDIO_BACKEND_URL) {
    try {
      const response = await fetch(`${AUDIO_BACKEND_URL}/audio/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        return data.url || null
      }
    } catch (error) {
      console.error("Error fetching audio URL:", error)
    }
  }

  // Return null if no backend configured
  return null
}

/**
 * Check if audio mode is available
 * Returns true if the backend is configured
 */
export async function isAudioModeAvailable(): Promise<boolean> {
  return !!process.env.AUDIO_BACKEND_URL
}
