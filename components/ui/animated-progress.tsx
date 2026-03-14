"use client"

import { cn } from "@/lib/utils"
import { useEffect, useId } from "react"

interface AnimatedProgressProps {
  /** Current progress percentage (0-100). If undefined, shows indeterminate animation */
  value?: number
  /** Height of the progress bar */
  size?: "sm" | "md" | "lg"
  /** Additional className */
  className?: string
}

// Inject CSS keyframes into document head once per page load
let cssInjected = false
function injectProgressCSS() {
  if (cssInjected || typeof document === "undefined") return
  cssInjected = true
  
  const style = document.createElement("style")
  style.id = "animated-progress-css"
  style.textContent = `
    @keyframes ap-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes ap-slide {
      0% { left: -30%; }
      100% { left: 100%; }
    }
  `
  document.head.appendChild(style)
}

/**
 * Animated progress bar with CSS animations injected into document head.
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  className 
}: AnimatedProgressProps) {
  const height = { sm: 6, md: 8, lg: 12 }[size]
  const isIndeterminate = value === undefined
  
  // Inject CSS on mount
  useEffect(() => {
    injectProgressCSS()
  }, [])

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="relative w-full overflow-hidden rounded-full"
        style={{ height, backgroundColor: "rgba(236, 72, 153, 0.2)" }}
      >
        {isIndeterminate ? (
          /* Indeterminate: sliding bar */
          <div
            className="absolute rounded-full"
            style={{
              width: "30%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, #ec4899, #a855f7, transparent)",
              animation: "ap-slide 1.5s ease-in-out infinite",
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
            {/* Shimmer overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                animation: "ap-shimmer 1.2s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
