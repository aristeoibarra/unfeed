"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

interface ResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onStartOver: () => void;
  progress: number; // Progress in seconds
  duration?: number | null; // Total duration in seconds
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function calculatePercentage(
  progress: number,
  duration: number | null | undefined
): number {
  if (!duration || duration <= 0) return 0;
  return Math.min(100, Math.round((progress / duration) * 100));
}

// Simplified version - returns null (kept for backward compatibility)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ResumeDialog(_props: ResumeDialogProps) {
  return null;
}

interface ResumeDialogFullProps extends ResumeDialogProps {
  videoTitle?: string;
}

export function ResumeDialogFull({
  isOpen,
  onClose,
  onResume,
  onStartOver,
  progress,
  duration,
  videoTitle,
}: ResumeDialogFullProps) {
  const percentage = calculatePercentage(progress, duration);
  const formattedProgress = formatTime(progress);
  const formattedDuration = duration ? formatTime(duration) : null;

  // Ref for the primary action button to auto-focus
  const resumeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the resume button when dialog opens (TDA-friendly - clear primary action)
  useEffect(() => {
    if (isOpen && resumeButtonRef.current) {
      // Small delay to ensure dialog animation completes
      const timeoutId = setTimeout(() => {
        resumeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleResume = () => {
    onResume();
    onClose();
  };

  const handleStartOver = () => {
    onStartOver();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="resume-dialog-description"
      >
        <DialogHeader className="space-y-3">
          {/* Icon and title - Clear visual hierarchy */}
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock
              className="h-6 w-6 text-primary"
              aria-hidden="true"
            />
          </div>
          <DialogTitle className="text-center text-xl">
            Continue watching?
          </DialogTitle>
          <DialogDescription
            id="resume-dialog-description"
            className="text-center space-y-2"
          >
            {videoTitle && (
              <span className="block font-medium text-[var(--foreground)] line-clamp-2">
                {videoTitle}
              </span>
            )}
            <span className="block text-[var(--muted-foreground)]">
              You left off at{" "}
              <span className="font-semibold text-primary">
                {formattedProgress}
              </span>
              {formattedDuration && (
                <span className="text-[var(--muted-foreground)]">
                  {" "}
                  of {formattedDuration}
                </span>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar visualization - Visual feedback */}
        <div className="py-4" aria-hidden="true">
          <div
            className="w-full h-2.5 bg-[var(--secondary)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--muted-foreground)]">
            <span>{formattedProgress}</span>
            <span className="font-medium text-primary">
              {percentage}% watched
            </span>
            {formattedDuration && <span>{formattedDuration}</span>}
          </div>
        </div>

        {/* Action buttons - Clear hierarchy: primary action is more prominent */}
        <DialogFooter className="flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="w-full sm:w-auto gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Start from beginning
          </Button>
          <Button
            ref={resumeButtonRef}
            onClick={handleResume}
            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Continue from {formattedProgress}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
