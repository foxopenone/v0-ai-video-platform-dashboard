"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

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
 * Animated progress bar that ALWAYS shows movement using JavaScript intervals.
 * 
 * Key insight: CSS keyframe animations are unreliable in Next.js/React SSR environments.
 * This component uses setInterval to drive all animations via React state updates,
 * guaranteeing that the progress bar will always animate regardless of CSS issues.
 * 
 * - When value is provided: shows filled portion with moving shimmer light
 * - When value is undefined: shows sliding bar animation
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  showPercentage = false,
  className 
}: AnimatedProgressProps) {
  const height = { sm: 6, md: 8, lg: 12 }[size]
  const isIndeterminate = value === undefined
  
  // JavaScript-driven animation position (0-100)
  const [animPos, setAnimPos] = useState(0)
  
  // Drive animation with setInterval - this ALWAYS works regardless of CSS
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimPos(prev => {
        const next = prev + 2 // Move 2% each tick
        return next > 100 ? 0 : next // Reset to 0 when reaching 100
      })
    }, 30) // 30ms = ~33fps, smooth animation
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="relative w-full overflow-hidden rounded-full"
        style={{ height, backgroundColor: "rgba(236, 72, 153, 0.2)" }}
      >
        {isIndeterminate ? (
          /* Indeterminate: sliding bar driven by JS state */
          <div
            className="absolute rounded-full"
            style={{
              width: "30%",
              height: "100%",
              left: `${animPos - 30}%`, // Start off-screen left, move right
              background: "linear-gradient(90deg, transparent, #ec4899, #a855f7, transparent)",
              transition: animPos === 0 ? "none" : "left 30ms linear", // No transition on reset
            }}
          />
        ) : (
          /* Determinate: filled bar with JS-driven shimmer */
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              width: `${Math.max(value, 3)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #ec4899, #a855f7)",
              transition: "width 0.3s ease-out",
            }}
          >
            {/* Shimmer light driven by JS state - moves across the filled bar */}
            <div
              className="absolute"
              style={{
                width: "40%",
                height: "100%",
                left: `${animPos - 20}%`,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                transition: animPos === 0 ? "none" : "left 30ms linear",
              }}
            />
          </div>
        )}
      </div>
      {showPercentage && value !== undefined && (
        <p className="mt-1 text-right text-[10px] text-muted-foreground">{Math.round(value)}%</p>
      )}
    </div>
  )
}
