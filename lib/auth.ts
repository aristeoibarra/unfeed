import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"

// Environment validation
const getSecret = (): Uint8Array => {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters long")
  }
  return new TextEncoder().encode(secret)
}

const COOKIE_NAME = "auth_token"
const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS) || 7

/**
 * JWT Payload interface extending jose's JWTPayload
 */
export interface AuthPayload extends JWTPayload {
  email: string
}

/**
 * Create a JWT token for the given email
 *
 * Based on jose documentation:
 * - Uses SignJWT class with HS256 algorithm
 * - Sets issued at time and expiration
 *
 * @param email - User email to include in the token
 * @returns Promise resolving to the signed JWT string
 */
export async function createToken(email: string): Promise<string> {
  const secret = getSecret()

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret)

  return token
}

/**
 * Verify a JWT token and return the payload
 *
 * Based on jose documentation:
 * - Uses jwtVerify with symmetric secret
 * - Returns null if verification fails
 *
 * @param token - JWT string to verify
 * @returns Promise resolving to AuthPayload or null if invalid
 */
export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)

    // Validate that the payload contains an email
    if (typeof payload.email !== "string") {
      return null
    }

    return payload as AuthPayload
  } catch {
    // Token is invalid, expired, or malformed
    return null
  }
}

/**
 * Get the current session from cookies
 *
 * Based on Next.js documentation:
 * - Uses cookies() from next/headers (async in Next.js 15+)
 * - Returns null if no session cookie exists
 *
 * @returns Promise resolving to AuthPayload or null
 */
export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  return verifyToken(token)
}

/**
 * Set the session cookie with the JWT token
 *
 * Based on Next.js documentation:
 * - httpOnly: true - prevents JavaScript access (XSS protection)
 * - secure: true in production - only sent over HTTPS
 * - sameSite: lax - basic CSRF protection
 *
 * @param token - JWT string to store in the cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60, // Convert days to seconds
    path: "/"
  })
}

/**
 * Delete the session cookie (logout)
 *
 * @returns Promise that resolves when cookie is deleted
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
