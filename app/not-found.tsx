import { EmptyState } from "@/components/ui/empty-state"
import { Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved. Let's get you back on track."
      />
    </div>
  )
}
