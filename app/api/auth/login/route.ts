import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createToken, setSessionCookie } from "@/lib/auth"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { prisma } from "@/lib/db"

// Rate limit: 5 attempts per 15 minutes
const LOGIN_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 15 * 60,
}

/**
 * POST /api/auth/login
 *
 * Authenticates user against credentials stored in database.
 * On success, creates a JWT token and sets it as an httpOnly cookie.
 *
 * Security measures:
 * - Uses bcrypt to compare password against stored hash
 * - Same error message for invalid email or password (prevents enumeration)
 * - Rate limiting: 5 attempts per 15 minutes per IP
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Check rate limit
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`login:${clientIP}`, LOGIN_RATE_LIMIT)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(rateLimit.resetIn / 60)} minutos.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetIn),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetIn),
          }
        }
      )
    }
    const body = await request.json()
    const { email, password } = body as { email?: string; password?: string }

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contrasena requeridos" },
        { status: 400 }
      )
    }

    // Validate data types
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Formato de datos invalido" },
        { status: 400 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      )
    }

    // Verify password against bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales invalidas" },
        { status: 401 }
      )
    }

    // Create JWT token and set cookie
    const token = await createToken(user.email)
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
