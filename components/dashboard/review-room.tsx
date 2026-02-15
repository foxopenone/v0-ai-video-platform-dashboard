"use client"

import { useState, useEffect, useCallback } from "react"
import {
  X, ChevronRight, Loader2, Play, Pause, RotateCcw,
  CheckCircle2, Download, Lock, FileText, ScrollText,
  Film, Copy, Check
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  fetchProjectDetail,
  reviewSynopsis,
  reviewScript,
  reviewEpisode,
  downloadEpisode,
} from "@/lib/mock-api"
import { cn } from "@/lib/utils"

// ---------- Types ----------
interface Episode {
  id: string
  number: number
  title: string
  status: "locked" | "reviewing" | "pending"
  videoUrl: string | null
}

interface ProjectDetail {
  id: string
  title: string
  status: "processing" | "pending_review" | "completed"
  progress: number
  episodes: Episode[]
  synopsis: string
  script: { ep: number; text: string }[]
  finalized: number
}

type Phase = 1 | 2 | 3

// ---------- Gradient for 9:16 player area ----------
const PLAYER_BG =
  "radial-gradient(ellipse at 40% 30%, rgba(244,63,122,0.18), rgba(168,85,247,0.12) 55%, rgba(10,10,20,0.97))"

// ---------- Main Component ----------
interface ReviewRoomProps {
  projectId: string
  onClose: () => void
}

export function ReviewRoom({ projectId, onClose }: ReviewRoomProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>(1)
  const [selectedEp, setSelectedEp] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Synopsis state
  const [synopsisText, setSynopsisText] = useState("")
  const [synopsisFeedback, setSynopsisFeedback] = useState("")
  const [synopsisApproved, setSynopsisApproved] = useState(false)

  // Script state
  const [scriptTexts, setScriptTexts] = useState<string[]>([])
  const [editingScript, setEditingScript] = useState<number | null>(null)
  const [scriptApproved, setScriptApproved] = useState(false)

  // Episode state
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [playingEp, setPlayingEp] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  const isReadOnly = project?.status === "completed"
  const isProcessing = project?.status === "processing"
  const finalized = episodes.filter((e) => e.status === "locked").length

  // Load project data
  useEffect(() => {
    setLoading(true)
    fetchProjectDetail(projectId).then((data) => {
      if (data) {
        setProject(data as ProjectDetail)
        setSynopsisText(data.synopsis)
        setScriptTexts(data.script.map((s) => s.text))
        setEpisodes(data.episodes)
        // Route to correct phase based on status
        if (data.status === "completed") {
          setPhase(3)
          setSynopsisApproved(true)
          setScriptApproved(true)
        } else if (data.status === "processing") {
          setPhase(1)
        } else {
          // pending_review: check what's already approved
          setPhase(1)
        }
      }
      setLoading(false)
    })
  }, [projectId])

  // ---------- Phase 1: Synopsis ----------
  const handleSynopsisApprove = useCallback(async () => {
    setSubmitting(true)
    await reviewSynopsis(projectId, "approve")
    setSynopsisApproved(true)
    setPhase(2)
    setSubmitting(false)
  }, [projectId])

  const handleSynopsisRetry = useCallback(async () => {
    setSubmitting(true)
    await reviewSynopsis(projectId, "retry", synopsisFeedback)
    setSynopsisFeedback("")
    setSubmitting(false)
  }, [projectId, synopsisFeedback])

  // ---------- Phase 2: Script ----------
  const handleScriptApprove = useCallback(async () => {
    setSubmitting(true)
    await reviewScript(projectId, "approve")
    setScriptApproved(true)
    setPhase(3)
    setSubmitting(false)
  }, [projectId])

  const handleScriptRetry = useCallback(async () => {
    setSubmitting(true)
    await reviewScript(projectId, "retry", JSON.stringify(scriptTexts))
    setSubmitting(false)
  }, [projectId, scriptTexts])

  // ---------- Phase 3: Episodes ----------
  const handleEpisodeApprove = useCallback(async (epIdx: number) => {
    setSubmitting(true)
    const ep = episodes[epIdx]
    await reviewEpisode(projectId, ep.id, "approve")
    setEpisodes((prev) =>
      prev.map((e, i) => {
        if (i === epIdx) return { ...e, status: "locked" as const }
        if (i === epIdx + 1 && e.status === "pending") return { ...e, status: "reviewing" as const }
        return e
      })
    )
    setSubmitting(false)
  }, [projectId, episodes])

  const handleEpisodeRetry = useCallback(async (epIdx: number) => {
    setSubmitting(true)
    const ep = episodes[epIdx]
    await reviewEpisode(projectId, ep.id, "retry")
    setSubmitting(false)
  }, [projectId, episodes])

  const handleDownload = useCallback(async (epId: string) => {
    await downloadEpisode(epId)
  }, [])

  const handleCopyScript = useCallback(() => {
    navigator.clipboard.writeText(scriptTexts.join("\n\n---\n\n"))
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }, [scriptTexts])

  // ---------- Loading ----------
  if (loading || !project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  const currentEp = episodes[selectedEp] || null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ===== HEADER ===== */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-5">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            Home
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <span className="font-medium text-foreground">{project.title}</span>
          {isReadOnly && (
            <Badge variant="outline" className="ml-2 border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[10px] text-[hsl(var(--success))]">
              Archived
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Finalized{" "}
            <span className="font-mono font-medium text-[var(--brand-pink)]">{finalized}</span>
            <span className="text-muted-foreground/60">/{episodes.length}</span>
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: 9:16 Player / Visual Area (40%) */}
        <div className="flex w-2/5 flex-col items-center justify-center border-r border-border/20 bg-background p-6">
          <div
            className="relative flex aspect-[9/16] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border border-border/25 ring-1 ring-inset ring-[hsla(0,0%,100%,0.04)]"
            style={{ backgroundImage: PLAYER_BG }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />

            {isProcessing ? (
              <div className="relative z-10 flex flex-col items-center gap-3 rounded-xl bg-background/40 px-6 py-5 backdrop-blur-md">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-pink)]" />
                <p className="text-xs font-medium text-foreground/80">AI Processing...</p>
                <p className="text-[10px] text-muted-foreground">
                  {project.progress}% complete
                </p>
              </div>
            ) : phase === 3 && currentEp ? (
              <button
                onClick={() => setPlayingEp(!playingEp)}
                className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm transition-transform hover:scale-110"
              >
                {playingEp ? (
                  <Pause className="h-6 w-6 text-foreground/80" />
                ) : (
                  <Play className="ml-1 h-6 w-6 text-foreground/80" />
                )}
              </button>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Film className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-[10px] text-muted-foreground/50">Preview Area</p>
              </div>
            )}

            {/* Episode label at bottom */}
            {phase === 3 && currentEp && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background/90 to-transparent px-4 pb-4 pt-8">
                <p className="text-center text-xs font-medium text-foreground">
                  EP{String(currentEp.number).padStart(2, "0")}
                </p>
                <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
                  {currentEp.status === "locked" ? "Finalized" : currentEp.status === "reviewing" ? "Under Review" : "Pending"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Operation Area (60%) */}
        <div className="flex w-3/5 flex-col">
          {/* Phase stepper */}
          <div className="flex shrink-0 items-center gap-1 border-b border-border/20 px-5 py-3">
            {[
              { n: 1 as Phase, label: "Story Synopsis", icon: FileText },
              { n: 2 as Phase, label: "Narration Script", icon: ScrollText },
              { n: 3 as Phase, label: "Episode Videos", icon: Film },
            ].map((step, i) => {
              const StepIcon = step.icon
              const isActive = phase === step.n
              const isDone = step.n < phase || (step.n === 1 && synopsisApproved) || (step.n === 2 && scriptApproved)
              return (
                <div key={step.n} className="flex items-center">
                  {i > 0 && <div className={cn("mx-2 h-px w-6", isDone ? "bg-[hsl(var(--success))]" : "bg-border/30")} />}
                  <button
                    onClick={() => {
                      if (!isProcessing) setPhase(step.n)
                    }}
                    disabled={isProcessing}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      isActive ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70",
                      isDone && !isActive && "text-[hsl(var(--success))]"
                    )}
                  >
                    {isDone && !isActive ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                    {step.label}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Phase progress bar */}
          <div className="flex shrink-0 gap-1 px-5 pt-2">
            <div className={cn("h-1 flex-1 rounded-full", synopsisApproved ? "bg-[hsl(var(--success))]" : phase === 1 ? "brand-gradient" : "bg-secondary/30")} />
            <div className={cn("h-1 flex-1 rounded-full", scriptApproved ? "bg-[hsl(var(--success))]" : phase === 2 ? "brand-gradient" : "bg-secondary/30")} />
            <div className={cn("h-1 flex-1 rounded-full", episodes.every((e) => e.status === "locked") ? "bg-[hsl(var(--success))]" : phase === 3 ? "brand-gradient" : "bg-secondary/30")} />
          </div>

          {/* Content area */}
          <ScrollArea className="flex-1 px-5 py-4">
            {/* Processing overlay */}
            {isProcessing && (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border/20 bg-secondary/10 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
                <p className="text-sm font-medium text-foreground/80">AI is processing your project...</p>
                <p className="text-xs text-muted-foreground">Progress: {project.progress}%</p>
              </div>
            )}

            {/* ===== PHASE 1: Synopsis ===== */}
            {!isProcessing && phase === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Story Synopsis</h3>
                  <p className="text-xs text-muted-foreground">Review and edit the overall narrative direction</p>
                </div>
                <textarea
                  value={synopsisText}
                  onChange={(e) => setSynopsisText(e.target.value)}
                  disabled={isReadOnly || synopsisApproved}
                  className="min-h-[160px] resize-none rounded-lg border border-border/30 bg-secondary/15 px-4 py-3 text-sm leading-relaxed text-foreground/90 outline-none transition-colors focus:border-[var(--brand-pink)]/40 disabled:opacity-60"
                  placeholder="Story synopsis..."
                />
                {!isReadOnly && !synopsisApproved && (
                  <>
                    <textarea
                      value={synopsisFeedback}
                      onChange={(e) => setSynopsisFeedback(e.target.value)}
                      className="min-h-[60px] resize-none rounded-lg border border-border/30 bg-secondary/10 px-4 py-3 text-xs text-foreground/80 outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--brand-pink)]/30"
                      placeholder="Optional: Add feedback or revision notes..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSynopsisRetry}
                        disabled={submitting}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                      <button
                        onClick={handleSynopsisApprove}
                        disabled={submitting}
                        className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve &amp; Generate Script
                      </button>
                    </div>
                  </>
                )}
                {synopsisApproved && (
                  <Badge variant="outline" className="w-fit border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-xs text-[hsl(var(--success))]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Synopsis Approved
                  </Badge>
                )}
              </div>
            )}

            {/* ===== PHASE 2: Script ===== */}
            {!isProcessing && phase === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Narration Script</h3>
                    <p className="text-xs text-muted-foreground">Click any episode script to edit inline</p>
                  </div>
                  {(isReadOnly || scriptApproved) && (
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1.5 rounded-md border border-border/30 bg-secondary/20 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {copiedScript ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedScript ? "Copied" : "Copy All"}
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {scriptTexts.map((text, i) => (
                    <div key={i} className="rounded-lg border border-border/20 bg-secondary/10 transition-all hover:border-border/40">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          EP{String(i + 1).padStart(2, "0")}
                        </span>
                        {!isReadOnly && !scriptApproved && (
                          <button
                            onClick={() => setEditingScript(editingScript === i ? null : i)}
                            className="text-[10px] text-[var(--brand-pink)] transition-colors hover:text-[var(--brand-pink)]/70"
                          >
                            {editingScript === i ? "Collapse" : "Edit"}
                          </button>
                        )}
                      </div>
                      {editingScript === i ? (
                        <textarea
                          value={text}
                          onChange={(e) => {
                            const next = [...scriptTexts]
                            next[i] = e.target.value
                            setScriptTexts(next)
                          }}
                          className="w-full resize-none border-t border-border/20 bg-transparent px-3 py-2 text-xs leading-relaxed text-foreground/80 outline-none"
                          rows={6}
                        />
                      ) : (
                        <p className="line-clamp-2 px-3 pb-2 text-xs text-foreground/60">
                          {text.split("\n")[0]}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {!isReadOnly && !scriptApproved && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleScriptRetry}
                      disabled={submitting}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                    <button
                      onClick={handleScriptApprove}
                      disabled={submitting}
                      className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm &amp; Start Synthesis
                    </button>
                  </div>
                )}
                {scriptApproved && (
                  <Badge variant="outline" className="w-fit border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-xs text-[hsl(var(--success))]">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Script Confirmed
                  </Badge>
                )}
              </div>
            )}

            {/* ===== PHASE 3: Episodes ===== */}
            {!isProcessing && phase === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Episode Videos</h3>
                  <p className="text-xs text-muted-foreground">Review each episode individually. Approved episodes are locked permanently.</p>
                </div>

                {/* Episode grid */}
                <div className="flex flex-wrap gap-1.5">
                  {episodes.map((ep, i) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEp(i)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all",
                        selectedEp === i
                          ? "brand-gradient text-[#fff] brand-glow-sm"
                          : ep.status === "locked"
                            ? "border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                            : ep.status === "reviewing"
                              ? "border border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                              : "border border-border/30 bg-secondary/20 text-muted-foreground"
                      )}
                    >
                      {ep.status === "locked" && selectedEp !== i ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        ep.number
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected episode detail */}
                {currentEp && (
                  <div className="rounded-xl border border-border/25 bg-secondary/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          EP{String(currentEp.number).padStart(2, "0")}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px]",
                            currentEp.status === "locked" && "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]",
                            currentEp.status === "reviewing" && "border-[var(--brand-pink)]/30 text-[var(--brand-pink)]",
                            currentEp.status === "pending" && "border-border/30 text-muted-foreground"
                          )}
                        >
                          {currentEp.status === "locked" ? "Finalized" : currentEp.status === "reviewing" ? "Under Review" : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {/* Episode actions */}
                    {currentEp.status === "locked" ? (
                      <button
                        onClick={() => handleDownload(currentEp.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-purple)]/30 bg-[var(--brand-purple)]/10 px-4 py-2.5 text-xs font-medium text-[var(--brand-purple)] transition-colors hover:bg-[var(--brand-purple)]/20"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Episode
                      </button>
                    ) : currentEp.status === "reviewing" && !isReadOnly ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEpisodeRetry(selectedEp)}
                          disabled={submitting}
                          className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Redo
                        </button>
                        <button
                          onClick={() => handleEpisodeApprove(selectedEp)}
                          disabled={submitting}
                          className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve &amp; Lock
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">
                        {currentEp.status === "pending" ? "Waiting for previous episodes to be reviewed." : "This episode is view-only."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
