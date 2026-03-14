"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

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
 * Animated progress bar that ALWAYS shows movement using requestAnimationFrame.
 * 
 * Uses requestAnimationFrame for smooth, reliable animation that won't stop.
 * The shimmer continuously moves from left to right across the progress bar.
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  showPercentage = false,
  className 
}: AnimatedProgressProps) {
  const height = { sm: 6, md: 8, lg: 12 }[size]
  const isIndeterminate = value === undefined
  
  // Use ref for animation position to avoid re-renders stopping animation
  const animPosRef = useRef(0)
  const [, forceUpdate] = useState(0)
  
  // Drive animation with requestAnimationFrame - guaranteed smooth animation
  useEffect(() => {
    let animationId: number
    let lastTime = 0
    
    const animate = (currentTime: number) => {
      // Move ~3% per 30ms for smooth animation
      if (currentTime - lastTime >= 30) {
        animPosRef.current = (animPosRef.current + 3) % 120 // 0-120 range for smooth looping
        forceUpdate(n => n + 1) // Trigger re-render
        lastTime = currentTime
      }
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  // Calculate shimmer position (-20 to 100)
  const shimmerLeft = animPosRef.current - 20

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
              left: `${shimmerLeft}%`,
              background: "linear-gradient(90deg, transparent, #ec4899, #a855f7, transparent)",
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
            {/* Shimmer light - continuously moving */}
            <div
              className="absolute"
              style={{
                width: "50%",
                height: "100%",
                left: `${shimmerLeft}%`,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
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
