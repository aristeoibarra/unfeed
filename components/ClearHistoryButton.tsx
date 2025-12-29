"use client"

import { useState } from "react"
import { clearHistory } from "@/actions/history"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Loader2, History } from "lucide-react"

export function ClearHistoryButton() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleClear() {
    setLoading(true)
    try {
      await clearHistory()
      toast({
        title: "History cleared",
        description: "Your watch history has been cleared.",
      })
      setOpen(false)
    } catch {
      toast({
        title: "Failed to clear history",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <History className="h-5 w-5 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium">Clear watch history</p>
          <p className="text-sm text-muted-foreground">
            Remove all videos from your watch history
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear watch history?</DialogTitle>
            <DialogDescription>
              This will remove all videos from your watch history. Your watch time statistics will be preserved. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Clear history
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
