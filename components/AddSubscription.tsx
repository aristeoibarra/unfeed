"use client"

import { addSubscription } from "@/actions/subscriptions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function AddSubscription() {
  const router = useRouter()
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await addSubscription(url)

      if (result.success) {
        setUrl("")
        toast({
          title: "Subscription added",
          description: "The channel has been added to your subscriptions. Videos will sync shortly.",
          variant: "success",
        })
        router.refresh()
      } else {
        setError(result.error)
        toast({
          title: "Failed to add subscription",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      const message = "An unexpected error occurred. Please try again."
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError(null)
            }}
            placeholder="@midudev, channel URL, or channel name"
            disabled={loading}
            error={!!error}
            aria-label="YouTube channel URL"
            aria-describedby={error ? "url-error" : "url-hint"}
            className="pr-10"
          />
          {url && !loading && !error && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" aria-hidden="true" />
          )}
        </div>
        <Button
          type="submit"
          disabled={loading || !url.trim()}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Channel
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div
          id="url-error"
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Help text */}
      <p
        id="url-hint"
        className={cn(
          "text-xs text-muted-foreground",
          error && "sr-only"
        )}
      >
        Paste a YouTube channel URL, @handle, or /c/channelname link
      </p>
    </form>
  )
}
