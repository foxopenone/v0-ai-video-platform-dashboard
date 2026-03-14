"use client"

import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  /** Current progress percentage (0-100). If undefined, shows indeterminate animation */
  value?: number
  /** Height of the progress bar */
  size?: "sm" | "md" | "lg"
  /** Show percentage text */
  showPercentage?: boolean
  /** Additional className */
  className?: string
}

/**
 * Animated progress bar that always shows movement.
 * - When value is provided: shows filled portion with shimmer overlay
 * - When value is undefined: shows indeterminate sliding animation
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  showPercentage = false,
  className 
}: AnimatedProgressProps) {
  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size]

  const isIndeterminate = value === undefined

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("relative w-full overflow-hidden rounded-full bg-[var(--brand-pink)]/20", heightClass)}>
        {isIndeterminate ? (
          /* Indeterminate: sliding bar animation */
          <div
            className={cn("absolute left-0 w-1/3 rounded-full", heightClass)}
            style={{
              background: "linear-gradient(90deg, transparent, var(--brand-pink), var(--brand-purple), transparent)",
              animation: "progress-slide 1.5s ease-in-out infinite",
            }}
          />
        ) : (
          /* Determinate: filled bar with shimmer using ::after pseudo-element */
          <div
            className={cn("rounded-full animate-progress-shimmer", heightClass)}
            style={{
              width: `${Math.max(value, 3)}%`,
              background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
            }}
          />
        )}
      </div>
      {showPercentage && value !== undefined && (
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{Math.round(value)}%</p>
      )}
    </div>
  )
}
