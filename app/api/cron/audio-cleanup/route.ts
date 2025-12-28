import { NextRequest, NextResponse } from "next/server"
import { cleanupOldAudioFiles, getDiskUsage } from "@/lib/audio-cache"

const CRON_SECRET = process.env.CRON_SECRET

interface CleanupResult {
  success: boolean
  timestamp: string
  deletedFiles: number
  freedMB: number
  currentUsage: {
    totalFiles: number
    totalSizeGB: number
    usagePercent: number
  }
}

interface ErrorResponse {
  error: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<CleanupResult | ErrorResponse>> {
  // Verify authorization
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    )
  }

  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Run cleanup (deletes files not played in 30+ days)
    const cleanup = await cleanupOldAudioFiles()

    // Get current usage stats
    const usage = await getDiskUsage()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      deletedFiles: cleanup.deletedCount,
      freedMB: Math.round(cleanup.freedBytes / (1024 * 1024)),
      currentUsage: {
        totalFiles: usage.totalFiles,
        totalSizeGB: usage.totalSizeGB,
        usagePercent: usage.usagePercent,
      },
    })
  } catch (error) {
    console.error("Audio cleanup error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
