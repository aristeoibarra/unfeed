import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "auth_token"

/**
 * Public routes that don't require authentication
 * These routes are accessible without a valid JWT token
 */
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/audio", // Audio streaming endpoints - element doesn't send cookies properly
]

/**
 * Check if a path starts with any of the public routes
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a path is for static assets or Next.js internals
 */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/workbox") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    // Allow common static file extensions
    /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/.test(pathname)
  )
}

/**
 * Middleware function for authentication
 *
 * Based on Next.js middleware documentation:
 * - Runs before every request
 * - Can redirect or modify responses
 * - Uses Edge Runtime (no Node.js APIs)
 *
 * Security flow:
 * 1. Allow public routes and static assets
 * 2. Check for auth_token cookie
 * 3. Verify JWT signature and expiration
 * 4. Redirect to /login if not authenticated
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Allow static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Get the auth token from cookies
  const token = request.cookies.get(COOKIE_NAME)?.value

  // No token - redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  try {
    const secret = process.env.AUTH_SECRET
    if (!secret) {
      console.error("AUTH_SECRET not configured")
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const secretKey = new TextEncoder().encode(secret)
    await jwtVerify(token, secretKey)

    // Token is valid, continue to the requested page
    return NextResponse.next()
  } catch {
    // Token is invalid or expired - clear the cookie and redirect
    const loginUrl = new URL("/login", request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

/**
 * Middleware configuration
 *
 * The matcher defines which routes the middleware should run on.
 * We exclude:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico (favicon)
 * - icons folder (PWA icons)
 * - manifest.json (PWA manifest)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - workbox (workbox files)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)",
  ],
}
