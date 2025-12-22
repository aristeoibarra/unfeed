import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved. Let's get you back on track."
        action={
          <Link href="/">
            <Button>
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Button>
          </Link>
        }
      />
    </div>
  )
}
