"use client"

import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Film,
  FileText,
  Volume2,
  Subtitles,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { triggerWebhook } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

interface ReviewStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  status: "pending" | "reviewing" | "approved" | "rejected"
  content: string
}

const INITIAL_STEPS: ReviewStep[] = [
  {
    id: "script",
    label: "Script",
    icon: FileText,
    status: "reviewing",
    content:
      "Hook: Did you know 90% of viral shorts use this exact pattern?\n\nBody: In this episode, we break down the 3-step formula that top creators use to keep viewers watching until the very end...\n\nCTA: Follow for Part 2 where we reveal the secret sauce.",
  },
  {
    id: "voiceover",
    label: "Voiceover",
    icon: Volume2,
    status: "pending",
    content: "AI-generated voiceover using Rachel (American, Female). Duration: 42s. Tone: Energetic and conversational.",
  },
  {
    id: "captions",
    label: "Captions",
    icon: Subtitles,
    status: "pending",
    content: "Auto-generated captions with keyword highlighting. Style: Bold white with shadow. Position: Center-bottom. Word-by-word animation enabled.",
  },
  {
    id: "final",
    label: "Final Cut",
    icon: Film,
    status: "pending",
    content: "Compiled video: 9:16 portrait, 1080x1920, 42s duration. BGM: Lo-Fi Chill at 15% volume. Transitions: Smooth crossfade. Export format: MP4 H.264.",
  },
]

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectTitle?: string
}

export function ReviewModal({ open, onOpenChange, projectTitle = "EP01" }: ReviewModalProps) {
  const [steps, setSteps] = useState<ReviewStep[]>(INITIAL_STEPS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const currentStep = steps[currentIndex]

  const handleApprove = async () => {
    setSubmitting(true)
    await triggerWebhook("step-review/approve", {
      stepId: currentStep.id,
      project: projectTitle,
    })

    setSteps((prev) =>
      prev.map((s, i) => {
        if (i === currentIndex) return { ...s, status: "approved" }
        if (i === currentIndex + 1) return { ...s, status: "reviewing" }
        return s
      })
    )

    // Auto-advance to next unfinished step
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    setSubmitting(false)
  }

  const handleReject = async () => {
    setSubmitting(true)
    await triggerWebhook("step-review/reject", {
      stepId: currentStep.id,
      project: projectTitle,
    })

    setSteps((prev) =>
      prev.map((s, i) =>
        i === currentIndex ? { ...s, status: "rejected" } : s
      )
    )
    setSubmitting(false)
  }

  const allDone = steps.every((s) => s.status === "approved" || s.status === "rejected")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/30 bg-card p-0">
        <DialogHeader className="border-b border-border/20 px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            <Film className="h-4 w-4 text-[var(--brand-pink)]" />
            Step Review: {projectTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Review and approve each stage of the pipeline
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {steps.map((step, i) => {
            const StepIcon = step.icon
            return (
              <button
                key={step.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all",
                  i === currentIndex
                    ? "bg-secondary/60 text-foreground"
                    : "text-muted-foreground hover:text-foreground/70",
                  step.status === "approved" && "text-[hsl(var(--success))]",
                  step.status === "rejected" && "text-destructive"
                )}
              >
                <StepIcon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mx-5 mt-2 flex gap-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step.status === "approved" && "bg-[hsl(var(--success))]",
                step.status === "rejected" && "bg-destructive",
                step.status === "reviewing" && "brand-gradient",
                step.status === "pending" && "bg-secondary/40"
              )}
            />
          ))}
        </div>

        {/* Content preview */}
        <ScrollArea className="mx-5 mt-4 max-h-48">
          <div className="rounded-lg border border-border/20 bg-secondary/15 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  currentStep.status === "approved" && "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]",
                  currentStep.status === "rejected" && "border-destructive/30 text-destructive",
                  currentStep.status === "reviewing" && "border-[var(--brand-pink)]/30 text-[var(--brand-pink)]",
                  currentStep.status === "pending" && "border-border/30 text-muted-foreground"
                )}
              >
                {currentStep.status === "reviewing"
                  ? "Awaiting Review"
                  : currentStep.status.charAt(0).toUpperCase() + currentStep.status.slice(1)}
              </Badge>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
              {currentStep.content}
            </p>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/20 px-5 py-4">
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-30"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-muted-foreground">
              {currentIndex + 1}/{steps.length}
            </span>
            <button
              onClick={() => setCurrentIndex(Math.min(steps.length - 1, currentIndex + 1))}
              disabled={currentIndex === steps.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-30"
              aria-label="Next step"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Approve / Reject */}
          {allDone ? (
            <button
              onClick={() => onOpenChange(false)}
              className="brand-gradient rounded-lg px-5 py-2 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90"
            >
              Done
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                disabled={submitting || currentStep.status !== "reviewing"}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-30"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting || currentStep.status !== "reviewing"}
                className="flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
