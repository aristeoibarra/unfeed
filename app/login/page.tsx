import { LoginForm } from "@/components/auth/LoginForm"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesion",
  description: "Inicia sesion para acceder a Unfeed",
}

/**
 * Login page component
 *
 * Server Component that:
 * 1. Checks if user is already logged in
 * 2. Redirects to home if authenticated
 * 3. Renders login form if not authenticated
 *
 * Designed with TDA-friendly principles:
 * - Clear visual hierarchy
 * - Generous whitespace
 * - Focused, distraction-free layout
 */
export default async function LoginPage() {
  // Check if already logged in
  const session = await getSession()
  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <main className="w-full max-w-sm">
        {/* Logo and title - Clear visual hierarchy */}
        <header className="text-center mb-10">
          {/* Logo mark */}
          <div className="mx-auto w-16 h-16 mb-6 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold" aria-hidden="true">U</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Unfeed
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2 text-base">
            YouTube sin distracciones
          </p>
        </header>

        {/* Login form card - Elevated surface for focus */}
        <div className="bg-[var(--card)] rounded-2xl p-6 md:p-8 shadow-sm ring-1 ring-[var(--border)]">
          <h2 className="sr-only">Formulario de inicio de sesion</h2>
          <LoginForm />
        </div>

        {/* Footer - Subtle branding */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">
            Acceso privado
          </p>
        </footer>
      </main>
    </div>
  )
}
