"use client"

import { useActionState, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { loginAction, type LoginState } from "@/actions/auth"

/**
 * Login form using Server Actions
 *
 * Uses useActionState for better form handling
 * and direct Server Action integration
 */
export function LoginFormAction() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  )
  const [showPassword, setShowPassword] = useState(false)

  // Generate unique IDs for accessibility
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  return (
    <form
      action={formAction}
      className="space-y-5"
      aria-describedby={state.error ? errorId : undefined}
    >
      {/* Email input */}
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
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={isPending}
            autoComplete="email"
            className="w-full pl-10"
            aria-invalid={!!state.error}
          />
        </div>
      </div>

      {/* Password input */}
      <div className="space-y-2">
        <Label
          htmlFor={passwordId}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          Contraseña
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
            aria-hidden="true"
          />
          <Input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Tu contraseña"
            required
            disabled={isPending}
            autoComplete="current-password"
            className="w-full pl-10 pr-10"
            aria-invalid={!!state.error}
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
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

      {/* Error message */}
      {state.error && (
        <div
          id={errorId}
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isPending}
        loading={isPending}
        className="w-full h-11 text-base"
      >
        {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>
    </form>
  )
}
