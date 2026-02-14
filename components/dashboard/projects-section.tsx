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
  FolderOpen,
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
    className: "border-primary/30 bg-primary/10 text-primary",
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
    className: "border-[hsl(142,71%,45%)]/30 bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]",
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
    const amount = 320
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
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
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
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 w-72 shrink-0 animate-pulse rounded-xl bg-secondary/30"
              />
            ))
          : projects.map((project) => {
              const config = STATUS_CONFIG[project.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={project.id}
                  className="group w-72 shrink-0 cursor-pointer rounded-xl border border-border/30 bg-card p-4 transition-all hover:border-border/60 hover:bg-card/80"
                >
                  {/* Thumbnail area */}
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-secondary/40">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Film className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {project.episodes} episodes
                        </span>
                        <Clock className="ml-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {project.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge + progress */}
                  <div className="mt-3 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn("gap-1 text-[10px] font-medium", config.className)}
                    >
                      <StatusIcon className={cn("h-3 w-3", config.iconClass)} />
                      {config.label}
                    </Badge>
                    {project.status === "processing" && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {project.progress}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
      </div>
    </section>
  )
}
