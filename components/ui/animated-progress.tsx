"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

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
 * 
 * Uses CSS animations injected directly into head for maximum compatibility.
 */
export function AnimatedProgress({ 
  value, 
  size = "md", 
  showPercentage = false,
  className 
}: AnimatedProgressProps) {
  const height = { sm: 6, md: 8, lg: 12 }[size]
  const isIndeterminate = value === undefined
  const injectedRef = useRef(false)

  // Inject keyframes into document head once
  useEffect(() => {
    if (injectedRef.current) return
    injectedRef.current = true
    
    const styleId = "animated-progress-keyframes"
    if (document.getElementById(styleId)) return
    
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      @keyframes ap-slide {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      @keyframes ap-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    `
    document.head.appendChild(style)
  }, [])

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="relative w-full overflow-hidden rounded-full"
        style={{ height, backgroundColor: "rgba(236, 72, 153, 0.2)" }}
      >
        {isIndeterminate ? (
          /* Indeterminate: sliding bar animation */
          <div
            className="absolute rounded-full"
            style={{
              width: "25%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, #ec4899, #a855f7, transparent)",
              animation: "ap-slide 1.5s ease-in-out infinite",
            }}
          />
        ) : (
          /* Determinate: filled bar with shimmer overlay */
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
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                animation: "ap-shimmer 1.2s ease-in-out infinite",
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
