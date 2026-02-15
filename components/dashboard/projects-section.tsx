"use client"

import { useState, useEffect, useRef } from "react"
import {
  Loader2,
  Eye,
  CheckCircle2,
  Clock,
  Film,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { fetchProjects } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  title: string
  status: "processing" | "pending_review" | "completed"
  progress: number
  date: string
  thumbnail: string | null
  episodes: number
}

const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]",
    iconClass: "animate-spin",
  },
  pending_review: {
    label: "Pending Review",
    icon: Eye,
    className: "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]",
    iconClass: "",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    iconClass: "",
  },
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data)
      setLoading(false)
    })
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 220
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section id="projects" className="px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Projects</h2>
          <p className="text-sm text-muted-foreground">
            Track your video pipeline progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] w-40 shrink-0 animate-pulse rounded-xl bg-secondary/30"
              />
            ))
          : projects.map((project) => {
              const config = STATUS_CONFIG[project.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={project.id}
                  className="group relative w-40 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border/30 bg-card transition-all hover:border-border/60"
                >
                  {/* 9:16 vertical thumbnail area */}
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-secondary/30">
                    {/* Phone frame lines for visual context */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {/* Decorative film grain / abstract visual */}
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `radial-gradient(circle at 30% 40%, var(--brand-pink), transparent 60%), radial-gradient(circle at 70% 60%, var(--brand-purple), transparent 60%)`
                      }} />
                      <Play className="h-8 w-8 text-muted-foreground/20 transition-colors group-hover:text-[var(--brand-pink)]/40" />
                    </div>

                    {/* Top-left episode count */}
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/60 px-1.5 py-0.5 backdrop-blur-sm">
                      <Film className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] font-medium text-foreground/80">
                        {project.episodes} EP
                      </span>
                    </div>

                    {/* Bottom overlay with info + badge */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-background/90 via-background/50 to-transparent px-2.5 pb-2.5 pt-8">
                      {/* Title + date */}
                      <div>
                        <p className="truncate text-xs font-medium leading-tight text-foreground">
                          {project.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">
                            {project.date}
                          </span>
                        </div>
                      </div>

                      {/* Status badge pinned to bottom */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 border px-1.5 py-0.5 text-[9px] font-medium",
                            config.className
                          )}
                        >
                          <StatusIcon className={cn("h-2.5 w-2.5", config.iconClass)} />
                          {config.label}
                        </Badge>
                        {project.status === "processing" && (
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {project.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
      </div>
    </section>
  )
}
