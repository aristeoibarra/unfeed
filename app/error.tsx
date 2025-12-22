"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<AlertTriangle className="h-8 w-8" />}
        title="Something went wrong"
        description="An unexpected error occurred. Don't worry, you can try again or go back to the home page."
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} variant="default">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline">
                <Home className="h-4 w-4" aria-hidden="true" />
                Back to home
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  )
}
