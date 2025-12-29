"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

/**
 * Logout button component
 *
 * Client component that handles logout by:
 * 1. Calling POST /api/auth/logout
 * 2. Redirecting to /login
 * 3. Refreshing the router cache
 *
 * Uses shadcn/ui Button for consistent styling and accessibility
 */
export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    }

    router.push("/login")
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2 text-[var(--muted-foreground)] hover:text-destructive hover:bg-destructive/10"
      title="Cerrar sesion"
      aria-label="Cerrar sesion"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Salir</span>
    </Button>
  )
}
