"use server"

import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const COOKIE_NAME = "auth_token"
const SESSION_DAYS = 7

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters long")
  }
  return new TextEncoder().encode(secret)
}

export interface LoginState {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email y contraseña requeridos" }
  }

  const authEmail = process.env.AUTH_EMAIL
  const authPasswordHash = process.env.AUTH_PASSWORD_HASH

  // Debug log (remove in production)
  console.log("[Auth Debug] AUTH_EMAIL exists:", !!authEmail)
  console.log("[Auth Debug] AUTH_PASSWORD_HASH exists:", !!authPasswordHash)
  console.log("[Auth Debug] AUTH_PASSWORD_HASH length:", authPasswordHash?.length)

  if (!authEmail || !authPasswordHash) {
    console.error("[Auth Error] Missing AUTH_EMAIL or AUTH_PASSWORD_HASH")
    return { error: "Error de configuración del servidor" }
  }

  // Verify email
  if (email.toLowerCase() !== authEmail.toLowerCase()) {
    console.log("[Auth Debug] Email mismatch")
    return { error: "Credenciales inválidas" }
  }

  // Verify password
  try {
    const passwordMatch = await bcrypt.compare(password, authPasswordHash)
    console.log("[Auth Debug] Password match:", passwordMatch)

    if (!passwordMatch) {
      return { error: "Credenciales inválidas" }
    }
  } catch (err) {
    console.error("[Auth Error] bcrypt.compare failed:", err)
    return { error: "Error al verificar credenciales" }
  }

  // Create JWT token
  const secret = getSecret()
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/"
  })

  redirect("/")
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/login")
}
