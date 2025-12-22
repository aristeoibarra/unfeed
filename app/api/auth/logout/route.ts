import { NextResponse } from "next/server"
import { deleteSessionCookie } from "@/lib/auth"

/**
 * POST /api/auth/logout
 *
 * Logs out the user by deleting the session cookie.
 * The cookie deletion effectively invalidates the session.
 */
export async function POST(): Promise<NextResponse> {
  await deleteSessionCookie()
  return NextResponse.json({ success: true })
}
