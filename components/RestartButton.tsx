"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface RestartButtonProps {
  onRestart: () => void
}

export function RestartButton({ onRestart }: RestartButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRestart}
      className="gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      aria-label="Restart video from beginning"
    >
      <RotateCcw className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Restart</span>
    </Button>
  )
}
