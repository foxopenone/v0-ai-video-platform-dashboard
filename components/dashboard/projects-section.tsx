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
  Trash2,
  Send,
  ShieldCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { fetchProjects } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  title: string
  status: "processing" | "pending_review" | "approved" | "completed"
  progress: number
  date: string
  thumbnail: string | null
  episodes: number
  airtableRecordId?: string
}

const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    icon: Loader2,
    className:
      "border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]",
    iconClass: "animate-spin",
  },
  pending_review: {
    label: "Pending",
    icon: Eye,
    className:
      "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)]",
    iconClass: "",
  },
  approved: {
    label: "Approved",
    icon: ShieldCheck,
    className:
      "border-[hsl(200,80%,55%)]/30 bg-[hsl(200,80%,55%)]/10 text-[hsl(200,80%,55%)]",
    iconClass: "",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    iconClass: "",
  },
}

// Deterministic gradient per project index
const GRADIENTS = [
  "radial-gradient(ellipse at 30% 20%, rgba(244,63,122,0.25), rgba(168,85,247,0.12) 50%, rgba(10,10,20,0.95))",
  "radial-gradient(ellipse at 60% 80%, rgba(168,85,247,0.25), rgba(244,63,122,0.10) 50%, rgba(10,10,20,0.95))",
  "radial-gradient(ellipse at 70% 30%, rgba(244,63,122,0.20), rgba(100,60,180,0.15) 50%, rgba(10,10,20,0.95))",
  "radial-gradient(ellipse at 40% 70%, rgba(180,80,200,0.22), rgba(244,63,122,0.10) 50%, rgba(10,10,20,0.95))",
  "radial-gradient(ellipse at 50% 40%, rgba(244,63,122,0.18), rgba(168,85,247,0.18) 50%, rgba(10,10,20,0.95))",
  "radial-gradient(ellipse at 25% 60%, rgba(168,85,247,0.22), rgba(244,63,122,0.08) 50%, rgba(10,10,20,0.95))",
]

interface ProjectsSectionProps {
  onProjectClick?: (projectId: string) => void | Promise<void>
  onProjectDelete?: (projectId: string) => void
  insertedProjects?: Project[]
  hiddenProjectIds?: string[]
}

export function ProjectsSection({ onProjectClick, onProjectDelete, insertedProjects = [], hiddenProjectIds = [] }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data)
      setLoading(false)
    })
  }, [])

  // Merge inserted placeholder cards at the front, filter out hidden
  const allProjects = [...insertedProjects, ...projects].filter((p) => !hiddenProjectIds.includes(p.id))

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    })
  }

  return (
    <section id="projects">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">My Projects</h2>
          <p className="text-xs text-muted-foreground">
            Track your video pipeline progress
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/30 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/30 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Responsive grid -- cards stretch to fill full container width */}
      <div
        ref={scrollRef}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] animate-pulse rounded-xl bg-secondary/20"
              />
            ))
          : allProjects.map((project, idx) => {
              const config = STATUS_CONFIG[project.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={project.id}
                  className="group relative cursor-pointer"
                  onClick={() => onProjectClick?.(project.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onProjectClick?.(project.id)
                    }
                  }}
                >
                  <div
                    className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border/25 shadow-sm ring-1 ring-inset ring-[hsla(0,0%,100%,0.04)] transition-all group-hover:border-border/50"
                    style={{ backgroundImage: GRADIENTS[idx % GRADIENTS.length] }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm">
                        <Play className="h-4 w-4 text-foreground/80" />
                      </div>
                    </div>

                    {/* Episode count */}
                    <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/50 px-1.5 py-0.5 backdrop-blur-sm">
                      <Film className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[9px] font-medium text-foreground/80">
                        {project.episodes} EP
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onProjectDelete?.(project.id) }}
                      className="absolute right-1.5 top-1.5 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-background/70 border border-border/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 hover:border-red-500/40"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground group-hover:text-red-400" />
                    </button>

                    {/* Post to Discovery button (only for completed) */}
                    {project.status === "completed" && (
                      <button
                        onClick={(e) => { e.stopPropagation() }}
                        className="absolute right-1.5 top-9 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-background/70 border border-border/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--brand-pink)]/20 hover:border-[var(--brand-pink)]/40"
                        aria-label="Post to Discovery"
                        title="Post to Discovery"
                      >
                        <Send className="h-3 w-3 text-muted-foreground group-hover:text-[var(--brand-pink)]" />
                      </button>
                    )}

                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-2.5 pb-2.5 pt-10">
                      <div>
                        <p className="truncate text-[11px] font-medium leading-tight text-foreground">
                          {project.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                          <span className="text-[9px] text-muted-foreground/60">
                            {project.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 border px-1.5 py-0.5 text-[8px] font-medium",
                            config.className
                          )}
                        >
                          <StatusIcon className={cn("h-2.5 w-2.5", config.iconClass)} />
                          {config.label}
                        </Badge>
                        {project.status === "processing" && (
                          <div className="relative h-1 w-14 overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                            <div className="absolute inset-y-0 left-0 w-1/3 animate-[progress-slide_1.8s_ease-in-out_infinite] rounded-full bg-[var(--brand-pink)]" />
                          </div>
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
