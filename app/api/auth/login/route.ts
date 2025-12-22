import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createToken, setSessionCookie } from "@/lib/auth"

/**
 * POST /api/auth/login
 *
 * Authenticates user against credentials stored in environment variables.
 * On success, creates a JWT token and sets it as an httpOnly cookie.
 *
 * Security measures:
 * - Uses bcrypt to compare password against stored hash
 * - Same error message for invalid email or password (prevents enumeration)
 * - Rate limiting should be added at infrastructure level (e.g., Vercel, Cloudflare)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contrasena requeridos" },
        { status: 400 }
      )
    }

    // Validate email format
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Formato de datos invalido" },
        { status: 400 }
      )
    }

    // Get credentials from environment
    const authEmail = process.env.AUTH_EMAIL
    const authPasswordHash = process.env.AUTH_PASSWORD_HASH

    if (!authEmail || !authPasswordHash) {
      console.error("AUTH_EMAIL or AUTH_PASSWORD_HASH not configured")
      return NextResponse.json(
        { error: "Error de configuracion del servidor" },
        { status: 500 }
      )
    }

    // Verify email (case-insensitive comparison)
    if (email.toLowerCase() !== authEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      )
    }

    // Verify password against bcrypt hash
    const passwordMatch = await bcrypt.compare(password, authPasswordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      )
    }

    // Create JWT token and set cookie
    const token = await createToken(email)
    await setSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
