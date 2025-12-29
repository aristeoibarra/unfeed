"use client"

import { useState, type FormEvent, useId } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Login form component
 *
 * Client component that handles:
 * - Email and password input with visible labels (TDA-friendly)
 * - Password visibility toggle
 * - Form submission to /api/auth/login
 * - Error display with clear visual feedback
 * - Loading state
 */
export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Generate unique IDs for accessibility
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json() as { error?: string; success?: boolean }

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesion")
        return
      }

      // Redirect to home page on success
      router.push("/")
      router.refresh()
    } catch {
      setError("Error de conexion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-describedby={error ? errorId : undefined}
    >
      {/* Email input with visible label */}
      <div className="space-y-2">
        <Label
          htmlFor={emailId}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Email
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <Input
            id={emailId}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            className="w-full pl-10"
            aria-invalid={!!error}
          />
        </div>
      </div>

      {/* Password input with visible label and visibility toggle */}
      <div className="space-y-2">
        <Label
          htmlFor={passwordId}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Contrasena
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <Input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            placeholder="Tu contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="w-full pl-10 pr-10"
            aria-invalid={!!error}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8",
              "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              "focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Error message - Clear visual feedback */}
      {error && (
        <div
          id={errorId}
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit button - Primary action */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 text-base"
      >
        {isLoading ? "Iniciando sesion..." : "Iniciar Sesion"}
      </Button>
    </form>
  )
}
