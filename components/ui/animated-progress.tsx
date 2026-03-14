"use client"

import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  /** Current progress percentage (0-100). If undefined, shows indeterminate animation */
  value?: number
  /** Height of the progress bar */
  size?: "sm" | "md" | "lg"
  /** Additional className */
  className?: string
}

/**
 * Animated progress bar using pure CSS animations.
 * Embeds @keyframes directly in a <style> tag for guaranteed browser execution.
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  className 
}: AnimatedProgressProps) {
  const height = { sm: 6, md: 8, lg: 12 }[size]
  const isIndeterminate = value === undefined

  return (
    <>
      {/* Inline CSS keyframes - guaranteed to work in any browser */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-shimmer-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes progress-slide-move {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}} />
      
      <div className={cn("w-full", className)}>
        <div 
          className="relative w-full overflow-hidden rounded-full"
          style={{ height, backgroundColor: "rgba(236, 72, 153, 0.2)" }}
        >
          {isIndeterminate ? (
            /* Indeterminate: sliding bar with CSS animation */
            <div
              className="absolute rounded-full"
              style={{
                width: "30%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, #ec4899, #a855f7, transparent)",
                animation: "progress-slide-move 1.5s ease-in-out infinite",
              }}
            />
          ) : (
            /* Determinate: filled bar with shimmer */
            <div
              className="relative rounded-full overflow-hidden"
              style={{
                width: `${Math.max(value, 3)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ec4899, #a855f7)",
                transition: "width 0.3s ease-out",
              }}
            >
              {/* Shimmer using CSS animation */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                  animation: "progress-shimmer-move 1.2s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
