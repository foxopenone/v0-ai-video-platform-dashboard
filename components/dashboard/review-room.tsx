"use client"

import { useState, useEffect, useCallback } from "react"
import {
  X, ChevronRight, Loader2, Play, Pause, RotateCcw,
  CheckCircle2, Download, Lock, FileText, Mic, Film,
  Edit3, Plus, Trash2, User, AlertCircle, StopCircle, Send
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  fetchBibleFromR2,
  fetchScriptFromR2,
  reviewApprove,
  reviewEditContinue,
  reviewRedo,
  reviewSynopsis,
  reviewScript,
  reviewEpisode,
  downloadEpisode,
} from "@/lib/mock-api"
import type { BibleJSON, BibleCharacter, ScriptJSON, VOTimelineEvent } from "@/lib/mock-api"
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

const PLAYER_BG =
  "radial-gradient(ellipse at 40% 30%, rgba(244,63,122,0.18), rgba(168,85,247,0.12) 55%, rgba(10,10,20,0.97))"

// ---------- Step Review Props ----------
interface StepReviewProps {
  mode: "step_review"
  jobRecordId: string
  lockToken: string
  bibleR2Key: string
  currentStatus: string // e.g. "S3_Bible_Check" | "S5_Script_Check" | "S8_Render" | "S9_Done"
  projectTitle?: string
  workMode?: "Full_Auto" | "Step_Review" // Controls whether approval buttons are enabled
  onClose: () => void
  onApproved?: () => void
  onDelete?: () => void
  onStop?: () => void
  onPost?: (jobRecordId: string, videoParts: Array<{ part: string; url: string }>) => void
}

// ---------- Progress Props (real project, not yet in review status) ----------
interface ProgressProps {
  mode: "progress"
  jobRecordId: string
  projectTitle: string
  onClose: () => void
  onDelete?: () => void
  onStop?: () => void
  onPost?: (jobRecordId: string, videoParts: Array<{ part: string; url: string }>) => void
  /** Called when status reaches a Check state -- parent should switch to step_review */
  onReviewReady?: (data: { lockToken: string; bibleR2Key: string; currentStatus: string; workMode?: "Full_Auto" | "Step_Review" }) => void
}

// ---------- Legacy Props ----------
interface LegacyProps {
  mode?: "legacy"
  projectId: string
  onClose: () => void
}

type ReviewRoomProps = StepReviewProps | ProgressProps | LegacyProps

// ========== Character Card Component ==========
function CharacterCard({
  char,
  index,
  editing,
  onUpdate,
  onRemove,
}: {
  char: BibleCharacter
  index: number
  editing: boolean
  onUpdate: (index: number, field: string, value: string) => void
  onRemove: (index: number) => void
}) {
  const roleColors: Record<string, string> = {
    protagonist: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    antagonist: "border-red-500/30 bg-red-500/10 text-red-400",
    supporting: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  }
  const roleClass = roleColors[char.role?.toLowerCase()] || "border-border/30 bg-secondary/20 text-muted-foreground"

  if (editing) {
    return (
      <div className="rounded-xl border border-[var(--brand-pink)]/30 bg-secondary/15 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--brand-pink)]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Character {index + 1}
            </span>
          </div>
          <button
            onClick={() => onRemove(index)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Name</label>
            <input
              value={char.name}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[var(--brand-pink)]/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Role</label>
            <select
              value={char.role}
              onChange={(e) => onUpdate(index, "role", e.target.value)}
              className="w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[var(--brand-pink)]/40"
            >
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
              <option value="narrator">Narrator</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              value={char.description}
              onChange={(e) => onUpdate(index, "description", e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-border/30 bg-background/50 px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-[var(--brand-pink)]/40"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/25 bg-secondary/10 p-4 transition-colors hover:border-border/40">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/30">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{char.name}</p>
          <Badge variant="outline" className={cn("mt-0.5 text-[9px]", roleClass)}>
            {char.role}
          </Badge>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-foreground/60">{char.description}</p>
      {char.relation_map && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground/40">Relation:</span> {char.relation_map}
        </p>
      )}
      {char.intent_tag && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground/40">Intent:</span> {char.intent_tag}
        </p>
      )}
    </div>
  )
}

// ========== Main Component ==========
export function ReviewRoom(props: ReviewRoomProps) {
  const isStepReview = props.mode === "step_review"
  const isProgress = props.mode === "progress"
  const onClose = props.onClose

  // Step Review state
  const [bible, setBible] = useState<BibleJSON | null>(null)
  const [originalBible, setOriginalBible] = useState<BibleJSON | null>(null)
  const [bibleLoading, setBibleLoading] = useState(false)
  const [bibleError, setBibleError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [actionStatus, setActionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [actionMessage, setActionMessage] = useState("")
  // Global action lock: once any action fires, ALL buttons are disabled until next phase loads.
  // This prevents duplicate POST requests that blow up backend AI nodes.
  const [actionLocked, setActionLocked] = useState(false)
  // Track when lock started for fake progress and 5-min auto-stop
  const [lockStartTime, setLockStartTime] = useState<number | null>(null)
  const [fakeProgress, setFakeProgress] = useState(0)
  // Remember which tab user was on before an approve/action switched tabs
  const [tabBeforeAction, setTabBeforeAction] = useState<string | null>(null)
  // Voice Over (Script) state for step_review
  type ReviewTab = "bible" | "voiceover" | "preview"
  // Track which phases have been approved (once approved, Edit/Redo are disabled)
  const [approvedPhases, setApprovedPhases] = useState<Set<ReviewTab>>(new Set())
  const [activeTab, setActiveTab] = useState<ReviewTab>("bible")
  const [scriptPolling, setScriptPolling] = useState(false)
  const [scriptData, setScriptData] = useState<ScriptJSON | null>(null)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [scriptR2Key, setScriptR2Key] = useState<string | null>(null)
  // Final Preview (Video) state for step_review
  interface VideoPart {
    part: string
    url: string
    approved: boolean     // frontend-only: user clicked Approve for this part
    redoing: boolean      // this part is being re-rendered after Redo
  }
  const [videoPolling, setVideoPolling] = useState(false)
  const [videoParts, setVideoParts] = useState<VideoPart[]>([])
  const [videoError, setVideoError] = useState<string | null>(null)
  const [selectedVideoPartId, setSelectedVideoPartId] = useState<string | null>(null)
  const [videoRenderProgress, setVideoRenderProgress] = useState(0) // 0-95 fake progress for video rendering
  const [videoRenderStartTime, setVideoRenderStartTime] = useState<number | null>(null)
  const [videoStopped, setVideoStopped] = useState(false) // true after user clicks Stop
  const [isCompleted, setIsCompleted] = useState(false) // true when project is S9_Done (read-only)
  // Work mode: "Full_Auto" disables all approval buttons; "Step_Review" enables them
  const [workMode, setWorkMode] = useState<"Full_Auto" | "Step_Review">(
    isStepReview ? ((props as StepReviewProps).workMode || "Step_Review") : "Step_Review"
  )
  // Helper: true if Full_Auto mode (all approval actions should be blocked)
  const isFullAuto = workMode === "Full_Auto"
  // Helper: true if status is in auto-flow phase (no human intervention needed)
  const currentStatusStr = isStepReview ? (props as StepReviewProps).currentStatus : ""
  const isAutoFlowPhase = /^S[1246]|S4_Visuals|S6_Audio|S7_Render/.test(currentStatusStr)

  // Auto-select first video part with a URL when videos arrive
  useEffect(() => {
    if (videoParts.length > 0 && !selectedVideoPartId) {
      const first = videoParts.find((vp) => vp.url)
      if (first) setSelectedVideoPartId(first.part)
    }
  }, [videoParts, selectedVideoPartId])

  // Legacy review state
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>(1)
  const [selectedEp, setSelectedEp] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [synopsisText, setSynopsisText] = useState("")
  const [synopsisEditing, setSynopsisEditing] = useState(false)
  const [synopsisConfirmed, setSynopsisConfirmed] = useState(false)
  const [voiceTexts, setVoiceTexts] = useState<string[]>([])
  const [editingVoice, setEditingVoice] = useState<number | null>(null)
  const [voiceConfirmed, setVoiceConfirmed] = useState(false)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [playingEp, setPlayingEp] = useState(false)

  // ── Estimate timeout based on episode count & current phase ──
  // Bible/VO: base 30s + 10s per episode. Video: 40s per episode (concurrent).
  // Fallback: 90s if episode count unknown.
  const episodeCount = bible?.episodes?.length || scriptData?.parts?.length || 0

  // ── Video rendering progress: animate from 0→~92% while videoPolling is active ──
  useEffect(() => {
    if (!videoPolling || !videoRenderStartTime) return
    const ESTIMATED_MS = Math.max((episodeCount || 3) * 40_000, 60_000)
    const interval = setInterval(() => {
      const elapsed = Date.now() - videoRenderStartTime
      const ratio = Math.min(elapsed / ESTIMATED_MS, 1)
      const pct = Math.min(92, Math.round(ratio * 120 * (1 - ratio * 0.3)))
      setVideoRenderProgress(pct)
    }, 400)
    return () => clearInterval(interval)
  }, [videoPolling, videoRenderStartTime, episodeCount])

  const estimateTimeoutMs = useCallback(() => {
    const epCount = Math.max(episodeCount, 1)
    if (activeTab === "preview" || videoPolling) {
      // Video rendering: 40s per episode, but concurrent, so just 40s + small buffer
      return (40 + epCount * 5) * 1000
    }
    // Bible / Voice Over phases: 30s base + 10s per episode
    return (30 + epCount * 10) * 1000
  }, [episodeCount, activeTab, videoPolling])

  // ── Fake Progress: animate from 0 to ~95% over estimated time, then auto-stop ──
  useEffect(() => {
    if (!actionLocked || !lockStartTime) { setFakeProgress(0); return }
    const TIMEOUT_MS = Math.max(estimateTimeoutMs(), 30_000) // at least 30s
    const HARD_LIMIT = 5 * 60 * 1000 // hard cap at 5 minutes
    const interval = setInterval(() => {
      const elapsed = Date.now() - lockStartTime
      if (elapsed >= HARD_LIMIT) {
        // Hard stop after 5 minutes, restore pre-action tab
        clearInterval(interval)
        setActionLocked(false)
        setActionStatus("error")
        setActionMessage("Timed out. Please check task status or try again.")
        setLockStartTime(null)
        setFakeProgress(0)
        setScriptPolling(false)
        setVideoPolling(false)
        if (tabBeforeAction && !approvedPhases.has(tabBeforeAction as ReviewTab)) {
          setActiveTab(tabBeforeAction as ReviewTab)
        }
        setTabBeforeAction(null)
        return
      }
      // Ease-out curve against estimated time (caps at 95%)
      const ratio = Math.min(elapsed / TIMEOUT_MS, 1)
      const pct = Math.min(95, Math.round(ratio * 120 * (1 - ratio * 0.3)))
      setFakeProgress(pct)
    }, 500)
    return () => clearInterval(interval)
  }, [actionLocked, lockStartTime, tabBeforeAction, estimateTimeoutMs, approvedPhases])

  // Helper: start the action lock with timestamp
  const startActionLock = useCallback((msg: string) => {
    setActionLocked(true)
    setActionStatus("submitting")
    setActionMessage(msg)
    setLockStartTime(Date.now())
    setFakeProgress(0)
  }, [])

  // Stop handler: cancel the waiting state
  // For video preview: stay on preview tab, show "stopped" state
  // For other tabs: go back if previous tab not approved
  const handleStop = useCallback(() => {
    // Stop all polling
    setScriptPolling(false)
    setVideoPolling(false)
    setVideoRenderStartTime(null)

    if (activeTab === "preview") {
      // Stay on preview tab, show stopped state
      setVideoStopped(true)
      setActionLocked(false)
      setActionStatus("idle")
      setActionMessage("")
      setLockStartTime(null)
      setFakeProgress(0)
      setTabBeforeAction(null)
    } else {
      setActionLocked(false)
      setActionStatus("idle")
      setActionMessage("")
      setLockStartTime(null)
      setFakeProgress(0)
      // Only go back if the previous tab hasn't been approved yet
      if (tabBeforeAction && !approvedPhases.has(tabBeforeAction as ReviewTab)) {
        setActiveTab(tabBeforeAction as ReviewTab)
      }
      setTabBeforeAction(null)
    }
  }, [tabBeforeAction, approvedPhases, activeTab])

  // ── Step Review: Load Bible JSON ──
  useEffect(() => {
    if (!isStepReview) return
    const { bibleR2Key, jobRecordId, currentStatus } = props as StepReviewProps

    // Normalize status for comparison
    const statusStr = String(currentStatus || "").trim()

    // Initialize approved phases based on current status
    // If we're at S5 or later, bible was already approved
    // If we're at S8 or later, both bible and VO were already approved
    const isBibleApproved = /S[5-9]|S5_Script|S8_Render|S9/i.test(statusStr)
    const isVoApproved = /S[8-9]|S8_Render|S9/i.test(statusStr)
    const isDone = /S9_Done|S9/i.test(statusStr)
    
    if (isBibleApproved) {
      setApprovedPhases((prev) => new Set(prev).add("bible"))
    }
    if (isDone) {
      setApprovedPhases(new Set(["bible", "voiceover", "preview"]))
      setIsCompleted(true)
    } else if (isVoApproved) {
      setApprovedPhases((prev) => { const s = new Set(prev); s.add("bible"); s.add("voiceover"); return s })
    }

    // Always load bible (it's the base data)
    setBibleLoading(true)
    setBibleError(null)
    fetchBibleFromR2(bibleR2Key)
      .then((data) => {
        console.log("[v0] 3. R2 fetched Bible JSON:", data)
        setBible(data)
        setOriginalBible(structuredClone(data))
      })
      .catch((err) => {
        console.error("[v0] Bible load FAILED:", err.message, "| R2Key:", bibleR2Key, "| RecordId:", jobRecordId)
        setBibleError(err.message)
      })
      .finally(() => setBibleLoading(false))

    // If status is S8_Render or S9, auto-switch to Final Preview tab
    if (/S8_Render|S8|S9/i.test(statusStr)) {
      setActiveTab("preview")
      if (isDone) {
        // S9_Done: videos are already rendered, just fetch them once (no polling)
        console.log("[v0] S9_Done -- loading final videos without polling")
        fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
          .then((r) => r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`)))
          .then((job: Record<string, unknown>) => {
            let finalVideos: Array<{ part: string; url: string }> = []
            if (job.Final_Video) {
              try {
                finalVideos = typeof job.Final_Video === "string"
                  ? JSON.parse(job.Final_Video as string)
                  : job.Final_Video as Array<{ part: string; url: string }>
              } catch { /* ignore parse errors */ }
            }
            if (finalVideos.length > 0) {
              setVideoParts(finalVideos.map((fv) => ({
                part: String(fv.part), url: fv.url, approved: true, redoing: false,
              })))
              setVideoRenderProgress(100)
            }
          })
          .catch((err: Error) => setVideoError(err.message))
      } else {
        // S8_Render: still rendering, start polling
        setVideoPolling(true)
        setVideoRenderStartTime(Date.now())
        setVideoRenderProgress(0)
      }
      // Also try to load script data in background (for VO tab browsing)
      fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
        .then((r) => r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`)))
        .then((job) => {
          if (job.Script_R2_Key) {
            setScriptR2Key(job.Script_R2_Key)
            return fetchScriptFromR2(job.Script_R2_Key).then((data) => setScriptData(data))
          }
        })
        .catch(() => { /* non-critical, VO tab just won't be browseable */ })
      return // skip S5 check below
    }

    // If status is already S5_Script_Check, auto-switch to Voice Over tab
    if (/S5_Script|S5/i.test(statusStr) && !isVoApproved) {
      setActiveTab("voiceover")
      // Fetch the script using job-status to get Script_R2_Key
      fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
        .then((r) => r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`)))
        .then((job) => {
          const sKey = job.Script_R2_Key
          if (sKey) {
            console.log("[v0] Auto-fetching script from R2:", sKey)
            setScriptR2Key(sKey)
            return fetchScriptFromR2(sKey)
          }
          throw new Error("Script_R2_Key not found in Airtable record")
        })
        .then((data) => {
          console.log("[v0] Script loaded:", data.parts.length, "parts")
          setScriptData(data)
        })
        .catch((err) => {
          console.error("[v0] Script auto-load failed:", err.message)
          setScriptError(err.message)
        })
    }
  }, [isStepReview, isStepReview ? (props as StepReviewProps).bibleR2Key : null, isStepReview ? (props as StepReviewProps).currentStatus : null])

  // ── Step Review: Edit Handlers ──
  const updateStorySummary = useCallback((value: string) => {
    setBible((prev) => prev ? { ...prev, story_summary: value } : prev)
  }, [])

  const updateCharacter = useCallback((index: number, field: string, value: string) => {
    setBible((prev) => {
      if (!prev) return prev
      const chars = [...prev.characters]
      chars[index] = { ...chars[index], [field]: value }
      return { ...prev, characters: chars }
    })
  }, [])

  const removeCharacter = useCallback((index: number) => {
    setBible((prev) => {
      if (!prev) return prev
      return { ...prev, characters: prev.characters.filter((_, i) => i !== index) }
    })
  }, [])

  const addCharacter = useCallback(() => {
    setBible((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        characters: [
          ...prev.characters,
          { name: "New Character", role: "supporting", description: "Description..." },
        ],
      }
    })
  }, [])

  const updateEpisode = useCallback((index: number, field: string, value: string | string[]) => {
    setBible((prev) => {
      if (!prev) return prev
      const eps = [...prev.episodes]
      eps[index] = { ...eps[index], [field]: value }
      return { ...prev, episodes: eps }
    })
  }, [])

  const updateEpisodeVisualAnchor = useCallback((epIndex: number, anchorIndex: number, value: string) => {
    setBible((prev) => {
      if (!prev) return prev
      const eps = [...prev.episodes]
      const anchors = [...(eps[epIndex].visual_anchors || [])]
      anchors[anchorIndex] = value
      eps[epIndex] = { ...eps[epIndex], visual_anchors: anchors }
      return { ...prev, episodes: eps }
    })
  }, [])

  const addVisualAnchor = useCallback((epIndex: number) => {
    setBible((prev) => {
      if (!prev) return prev
      const eps = [...prev.episodes]
      const anchors = [...(eps[epIndex].visual_anchors || []), "00:00:00 - New visual anchor"]
      eps[epIndex] = { ...eps[epIndex], visual_anchors: anchors }
      return { ...prev, episodes: eps }
    })
  }, [])

  const removeVisualAnchor = useCallback((epIndex: number, anchorIndex: number) => {
    setBible((prev) => {
      if (!prev) return prev
      const eps = [...prev.episodes]
      const anchors = (eps[epIndex].visual_anchors || []).filter((_, i) => i !== anchorIndex)
      eps[epIndex] = { ...eps[epIndex], visual_anchors: anchors }
      return { ...prev, episodes: eps }
    })
  }, [])

  const cancelEdit = useCallback(() => {
    if (originalBible) setBible(structuredClone(originalBible))
    setEditMode(false)
  }, [originalBible])

  // ── Step Review: getCallbackInfo (shared by Bible and VO handlers) ──
  const getCallbackInfo = useCallback(() => {
    if (isStepReview) {
      const p = props as StepReviewProps
      return { jobRecordId: p.jobRecordId, lockToken: p.lockToken, bibleR2Key: p.bibleR2Key }
    }
    return null
  }, [isStepReview, props])

  /** Derive the backend status string from the active tab.
   *  Bible (S3_Bible_Check) -> /webhook/04-review-action
   *  VO (S5_Script_Check) / Preview (S8_Render) -> /webhook/05-redo */
  const currentPhaseStatus = activeTab === "voiceover" ? "S5_Script_Check"
    : activeTab === "preview" ? "S8_Render"
    : "S3_Bible_Check"

  // ── Voice Over: Edit handler (only `text` field is editable) ──
  const updateVOText = useCallback((partIdx: number, eventIdx: number, newText: string) => {
    setScriptData((prev) => {
      if (!prev) return prev
      const newParts = prev.parts.map((p, pi) => {
        if (pi !== partIdx) return p
        const newTimeline = p.timeline.map((evt, ei) =>
          ei === eventIdx ? { ...evt, text: newText } : evt
        )
        return { ...p, timeline: newTimeline }
      })
      return { ...prev, parts: newParts }
    })
  }, [])

  // ── Voice Over: Save & Continue (lossless writeback) ──
  const handleVOSaveAndContinue = useCallback(async () => {
    if (actionLocked) return // hard debounce
    if (!scriptData?._raw || !scriptR2Key) return
    const info = getCallbackInfo()
    if (!info) return

    // GLOBAL LOCK immediately
    startActionLock("Saving voice-over edits...")

    try {
      // Deep-clone the original raw JSON (full structure preserved)
      const patchedRaw = structuredClone(scriptData._raw) as Record<string, unknown>

      // Patch only `text` fields in parts[].timeline[]
      const rawParts = patchedRaw.parts as Array<Record<string, unknown>>
      for (let pi = 0; pi < scriptData.parts.length; pi++) {
        const rawTimeline = (rawParts[pi]?.timeline ?? []) as Array<Record<string, unknown>>
        for (let ei = 0; ei < scriptData.parts[pi].timeline.length; ei++) {
          if (rawTimeline[ei]) {
            rawTimeline[ei].text = scriptData.parts[pi].timeline[ei].text
          }
        }
      }

      console.log("[v0] VO writeback patchedRaw keys:", Object.keys(patchedRaw))

      // VO edit+approve -> writeback to R2 then POST /webhook/05-redo
      await reviewEditContinue(info.jobRecordId, info.lockToken, scriptR2Key, patchedRaw, "S5_Script_Check")
      setActionStatus("success")
      setApprovedPhases((prev) => new Set(prev).add("voiceover"))
      setActionMessage("Approved! Switching to Video Preview")
      startVideoPolling()
      // actionLocked stays TRUE until video data arrives
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Save failed")
      setActionLocked(false) // unlock on error
    }
  }, [scriptData, scriptR2Key, getCallbackInfo, actionLocked])

  // ── Step Review: Action Handlers ──

  /** After Approve or Save&Continue succeeds, switch to Voice Over tab and start polling */
  const startVoiceOverPolling = useCallback(() => {
    console.log("[v0] Switching to Voice Over tab and starting script polling")
    setTabBeforeAction(activeTab) // remember where user was
    setActiveTab("voiceover")
    setScriptPolling(true)
    setScriptData(null)
    setScriptError(null)
  }, [activeTab])

  /** After VO Approve/SaveAndContinue succeeds, switch to Final Preview tab and start video polling */
  const startVideoPolling = useCallback(() => {
    console.log("[v0] Switching to Final Preview tab and starting video polling")
    setTabBeforeAction(activeTab) // remember where user was
    setActiveTab("preview")
    // Clear the global lock -- preview tab has its own progress UI
    setActionLocked(false)
    setActionStatus("idle")
    setActionMessage("")
    setLockStartTime(null)
    setFakeProgress(0)
    // Start video-specific state
    setVideoPolling(true)
    setVideoParts([])
    setVideoError(null)
    setSelectedVideoPartId(null)
    setVideoRenderProgress(0)
    setVideoRenderStartTime(Date.now())
    setVideoStopped(false)
    setEditMode(false) // lock all edits
  }, [activeTab])

  const handleApprove = useCallback(async () => {
    if (actionLocked) return // hard debounce
    // BLOCK if Full_Auto mode -- no manual approval allowed
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleApprove blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info) return
    // GLOBAL LOCK: disable all buttons immediately before any network call
    startActionLock("Approving and continuing pipeline...")
    try {
      // Route: Bible->04-review-action, VO/Preview->05-redo
      await reviewApprove(info.jobRecordId, info.lockToken, currentPhaseStatus)
      setActionStatus("success")
      // Mark current phase as approved
      setApprovedPhases((prev) => new Set(prev).add(activeTab))
      // Notify parent to update card status
      if (isStepReview && (props as StepReviewProps).onApproved) {
        (props as StepReviewProps).onApproved!()
      }
      // Route to next phase based on current tab
      if (activeTab === "voiceover") {
        setActionMessage("Approved! Switching to Video Preview")
        startVideoPolling()
      } else {
        setActionMessage("Approved! Switching to Voice Over")
        startVoiceOverPolling()
      }
      // actionLocked stays TRUE -- only cleared when next phase data arrives
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Approve failed")
      setActionLocked(false) // unlock on error so user can retry
    }
  }, [getCallbackInfo, startVoiceOverPolling, startVideoPolling, activeTab, actionLocked, currentPhaseStatus, workMode])

  const handleSaveAndContinue = useCallback(async () => {
    if (actionLocked) return // hard debounce
    // BLOCK if Full_Auto mode
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleSaveAndContinue blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info || !bible) return
    const { jobRecordId, lockToken, bibleR2Key } = info
    // GLOBAL LOCK immediately
    startActionLock("Writing changes to R2 and continuing...")
    try {
      // Per backend spec: writeback MUST patch the original raw, not the display view.
      const patchedRaw = structuredClone(bible._raw ?? {}) as Record<string, unknown>

      // Patch character_graph
      patchedRaw.character_graph = bible.characters.map((c) => ({
        name: (c.name ?? "").trim(),
        role: (c.role ?? "").trim(),
        visual_feature: (c.description ?? "").trim(),
        relation_map: (c.relation_map ?? "").trim(),
        intent_tag: (c.intent_tag ?? "").trim(),
      }))

      // Patch meta.story_summary
      if (!patchedRaw.meta || typeof patchedRaw.meta !== "object") {
        patchedRaw.meta = {}
      }
      ;(patchedRaw.meta as Record<string, unknown>).story_summary = (bible.story_summary ?? "").trim()

      // Patch episode_index
      if (bible.episodes && bible.episodes.length > 0) {
        const epIndex: Record<string, unknown> = {}
        for (const ep of bible.episodes) {
          epIndex[ep.key.trim()] = {
            setting: (ep.setting ?? "").trim(),
            summary: (ep.summary ?? "").trim(),
            special_alerts: Array.isArray(ep.special_alerts) ? ep.special_alerts.map((s) => s.trim()) : [],
            visual_anchors: Array.isArray(ep.visual_anchors) ? ep.visual_anchors.map((s) => s.trim()) : [],
          }
        }
        patchedRaw.episode_index = epIndex
      }

      console.log("[v0] Writeback patchedRaw keys:", Object.keys(patchedRaw))
      // Bible edit+approve -> writeback to R2 then POST /webhook/04-review-action
      await reviewEditContinue(jobRecordId, lockToken, bibleR2Key, patchedRaw, "S3_Bible_Check")
      setOriginalBible(structuredClone(bible))
      setEditMode(false)
      setActionStatus("success")
      setApprovedPhases((prev) => new Set(prev).add("bible"))
      setActionMessage("Approved! Switching to Voice Over")
      startVoiceOverPolling()
      // actionLocked stays TRUE until VO data arrives
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Save & Continue failed")
      setActionLocked(false) // unlock on error
    }
  }, [getCallbackInfo, bible, actionLocked, workMode])

  const handleRedo = useCallback(async () => {
    if (actionLocked) return // hard debounce
    // BLOCK if Full_Auto mode
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleRedo blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info) return
    // GLOBAL LOCK immediately
    startActionLock("Requesting redo...")
    try {
      await reviewRedo(info.jobRecordId, info.lockToken, currentPhaseStatus)
      setActionStatus("success")
      setActionMessage("Redo triggered! Pipeline will restart this phase.")
      // Redo keeps lock -- page should be closed or refreshed
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Redo failed")
      setActionLocked(false) // unlock on error
    }
  }, [getCallbackInfo, currentPhaseStatus, actionLocked, workMode])

  /** Retry: call the backend redo API then restart polling so the UI picks up new data */
  const handleRetry = useCallback(async () => {
    if (actionLocked) return
    // BLOCK if Full_Auto mode
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleRetry blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info) return
    startActionLock("Retrying generation...")
    setScriptError(null)
    try {
      await reviewRedo(info.jobRecordId, info.lockToken, currentPhaseStatus)
      // Backend accepted -- restart polling to pick up new data
      setScriptData(null)
      setScriptPolling(true)
      setActionStatus("idle")
      setActionMessage("")
      setActionLocked(false)
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Retry failed")
      setActionLocked(false)
    }
  }, [getCallbackInfo, currentPhaseStatus, actionLocked, workMode])

  /** Retry video: call the backend redo API then restart video polling */
  const handleRetryVideo = useCallback(async () => {
    if (actionLocked) return
    // BLOCK if Full_Auto mode
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleRetryVideo blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info) return
    startActionLock("Retrying video render...")
    setVideoError(null)
    try {
      await reviewRedo(info.jobRecordId, info.lockToken, "S8_Render")
      // Backend accepted -- restart video polling to pick up new render
      setVideoParts([])
      setVideoStopped(false)
      setVideoRenderStartTime(Date.now())
      setVideoRenderProgress(0)
      setVideoPolling(true)
      setActionStatus("idle")
      setActionMessage("")
      setActionLocked(false)
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Retry failed")
      setActionLocked(false)
    }
  }, [getCallbackInfo, actionLocked])

  // ── Final Preview: Per-Part Approve (frontend-only, mark done) ──
  const handleVideoPartApprove = useCallback((partId: string) => {
    setVideoParts((prev) =>
      prev.map((vp) => vp.part === partId ? { ...vp, approved: true } : vp)
    )
  }, [])

  // ── Final Preview: Per-Part Redo (POST /webhook/05-redo with Part_Index) ──
  const handleVideoPartRedo = useCallback(async (partId: string) => {
    // BLOCK if Full_Auto mode
    if (workMode === "Full_Auto") {
      console.warn("[v0] handleVideoPartRedo blocked: Work_Mode is Full_Auto")
      return
    }
    const info = getCallbackInfo()
    if (!info) return
    // Mark this part as redoing
    setVideoParts((prev) =>
      prev.map((vp) => vp.part === partId ? { ...vp, redoing: true, approved: false, url: "" } : vp)
    )
    try {
      await reviewRedo(info.jobRecordId, info.lockToken, "S8_Render", Number(partId))
      console.log("[v0] Video redo triggered for Part", partId)
      // Keep polling -- the poller will pick up the new URL when ready
      setVideoPolling(true)
    } catch (err) {
      console.error("[v0] Video redo failed:", err)
      setVideoParts((prev) =>
        prev.map((vp) => vp.part === partId ? { ...vp, redoing: false } : vp)
      )
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Redo failed for Part " + partId)
    }
  }, [getCallbackInfo, workMode])

  // ── Final Preview: Per-Part Download ──
  const handleVideoDownload = useCallback((url: string, partId: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `part_${partId}.mp4`
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // ── Voice Over Script Polling (after Bible Approve/Save&Continue) ──
  useEffect(() => {
    if (!scriptPolling || !isStepReview) return
    const { jobRecordId } = props as StepReviewProps
    let stopped = false
    let failCount = 0
    const startTime = Date.now()
    const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

    console.log("[v0] Script poller STARTED for record:", jobRecordId)

    const poll = async () => {
      if (stopped) return

      // Timeout check
      if (Date.now() - startTime > TIMEOUT_MS) {
        stopped = true
        setScriptPolling(false)
        setScriptError("Request timed out (5 min). Please refresh the page or check task status.")
        return
      }

      try {
        const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
        if (!res.ok) {
          failCount++
          if (failCount >= 3) {
            stopped = true
            setScriptPolling(false)
            setScriptError(`API returned ${res.status} after ${failCount} retries`)
          }
          return
        }
        failCount = 0
        const job = await res.json()
        console.log(`[v0] Script poll | Status: ${job.Status} | Script_R2_Key: ${job.Script_R2_Key || "null"} | Work_Mode: ${job.Work_Mode || "null"}`)
        // Update workMode from backend (in case it changed or was not passed initially)
        if (job.Work_Mode) setWorkMode(job.Work_Mode as "Full_Auto" | "Step_Review")

        // Check for error/failed
        if (["Error", "Failed"].includes(job.Status)) {
          stopped = true
          setScriptPolling(false)
          setScriptError("Generation failed. Please retry or contact support.")
          return
        }

        // Check for Script_R2_Key
        if (job.Script_R2_Key) {
          console.log("[v0] Script R2 Key found! Fetching script...", job.Script_R2_Key)
          stopped = true
          setScriptPolling(false)
          setScriptR2Key(job.Script_R2_Key)
          try {
            const data = await fetchScriptFromR2(job.Script_R2_Key)
            console.log("[v0] Script loaded:", data.parts.length, "parts")
            setScriptData(data)
            // UNLOCK: next phase data arrived, user can interact again
            setActionLocked(false)
            setActionStatus("idle")
            setActionMessage("")
          } catch (err) {
            setScriptError(err instanceof Error ? err.message : "Failed to load script")
          }
          return
        }
      } catch (err) {
        failCount++
        if (failCount >= 3) {
          stopped = true
          setScriptPolling(false)
          setScriptError("Network error - could not reach backend")
        }
      }
    }

    poll()
    const interval = setInterval(poll, 10000) // 10 seconds per spec
    return () => { stopped = true; clearInterval(interval); console.log("[v0] Script poller STOPPED") }
  }, [scriptPolling, isStepReview])

  // ── Final Preview: Video Polling (after VO Approve or S8_Render auto-detect) ──
  useEffect(() => {
    if (!videoPolling || !isStepReview) return
    const { jobRecordId } = props as StepReviewProps
    let stopped = false
    let failCount = 0
    const startTime = Date.now()
    const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes (video rendering takes longer)

    console.log("[v0] Video poller STARTED for record:", jobRecordId)

    const poll = async () => {
      if (stopped) return

      if (Date.now() - startTime > TIMEOUT_MS) {
        stopped = true
        setVideoPolling(false)
        setVideoError("Video rendering timed out (15 min). Please refresh the page.")
        return
      }

      try {
        const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
        if (!res.ok) {
          failCount++
          if (failCount >= 3) {
            stopped = true
            setVideoPolling(false)
            setVideoError(`API returned ${res.status} after ${failCount} retries`)
          }
          return
        }
        failCount = 0
        const job = await res.json()
        console.log(`[v0] Video poll | Status: ${job.Status} | Final_Video: ${job.Final_Video ? "present" : "null"} | Work_Mode: ${job.Work_Mode || "null"}`)
        // Update workMode from backend
        if (job.Work_Mode) setWorkMode(job.Work_Mode as "Full_Auto" | "Step_Review")

        // Check for error/failed
        if (["Error", "Failed"].includes(job.Status)) {
          stopped = true
          setVideoPolling(false)
          setVideoError("Video rendering failed. Please retry or contact support.")
          return
        }

        // Parse Final_Video field (JSON array string or already parsed)
        let finalVideos: Array<{ part: string; url: string }> = []
        if (job.Final_Video) {
          try {
            finalVideos = typeof job.Final_Video === "string"
              ? JSON.parse(job.Final_Video)
              : job.Final_Video
          } catch {
            console.error("[v0] Failed to parse Final_Video:", job.Final_Video)
          }
        }

        if (finalVideos.length > 0) {
          console.log("[v0] Final_Video found:", finalVideos.length, "parts")
          // UNLOCK: video data arrived, user can interact with per-part actions
          setActionLocked(false)
          setActionStatus("idle")
          setActionMessage("")
          // Merge with existing state (preserve approved/redoing flags)
          setVideoParts((prev) => {
            return finalVideos.map((fv) => {
              const existing = prev.find((p) => p.part === String(fv.part))
              if (existing && existing.redoing && fv.url) {
                // Redo completed: new URL arrived, clear redoing
                return { part: String(fv.part), url: fv.url, approved: false, redoing: false }
              }
              if (existing && existing.approved) {
                // Keep approved state, update URL in case it changed
                return { ...existing, url: fv.url }
              }
              if (existing && !fv.url) {
                // URL not yet ready for this part
                return existing
              }
              // New part or update
              return {
                part: String(fv.part),
                url: fv.url || "",
                approved: existing?.approved ?? false,
                redoing: existing?.redoing ?? false,
              }
            })
          })

          // Check if all parts have URLs (rendering complete)
          const allReady = finalVideos.every((fv) => !!fv.url)
          // Check if any part is being re-done
          const anyRedoing = videoParts.some((vp) => vp.redoing)
          if (allReady && !anyRedoing) {
            // If status is S9_Done, stop polling entirely
      if (job.Status === "S9_Done") {
        console.log("[v0] All videos done, status S9_Done. Stopping video poller.")
        stopped = true
        setVideoPolling(false)
        setVideoRenderStartTime(null)
        setVideoRenderProgress(100)
      }
            // Otherwise keep polling for status updates
          }
        }
      } catch (err) {
        failCount++
        if (failCount >= 3) {
          stopped = true
          setVideoPolling(false)
          setVideoError("Network error - could not reach backend")
        }
      }
    }

    poll()
    const interval = setInterval(poll, 10000) // 10 seconds
    return () => { stopped = true; clearInterval(interval); console.log("[v0] Video poller STOPPED") }
  }, [videoPolling, isStepReview])

  // ── Legacy mode: no more mock data. Show loading=false immediately. ──
  useEffect(() => {
  if (isStepReview || isProgress) return
  // Legacy mode no longer loads mock data.
  // page.tsx already blocks this path with an error screen.
  setLoading(false)
  }, [isStepReview, isProgress])

  // Legacy handlers
  const handleSynopsisConfirm = useCallback(async () => {
    if (isStepReview) return
    setSubmitting(true)
    await reviewSynopsis((props as LegacyProps).projectId, "approve")
    setSynopsisConfirmed(true)
    setSynopsisEditing(false)
    setPhase(2)
    setSubmitting(false)
  }, [isStepReview, props])

  const handleSynopsisRetry = useCallback(async () => {
    if (isStepReview) return
    setSubmitting(true)
    await reviewSynopsis((props as LegacyProps).projectId, "retry")
    setSynopsisConfirmed(false)
    setSubmitting(false)
  }, [isStepReview, props])

  const handleVoiceConfirm = useCallback(async () => {
    if (isStepReview) return
    setSubmitting(true)
    await reviewScript((props as LegacyProps).projectId, "approve")
    setVoiceConfirmed(true)
    setEditingVoice(null)
    setPhase(3)
    setSubmitting(false)
  }, [isStepReview, props])

  const handleVoiceRetry = useCallback(async () => {
    if (isStepReview) return
    setSubmitting(true)
    await reviewScript((props as LegacyProps).projectId, "retry", JSON.stringify(voiceTexts))
    setVoiceConfirmed(false)
    setSubmitting(false)
  }, [isStepReview, props, voiceTexts])

  const handleEpisodeApprove = useCallback(async (epIdx: number) => {
    if (isStepReview) return
    setSubmitting(true)
    const ep = episodes[epIdx]
    await reviewEpisode((props as LegacyProps).projectId, ep.id, "approve")
    setEpisodes((prev) =>
      prev.map((e, i) => {
        if (i === epIdx) return { ...e, status: "locked" as const }
        if (i === epIdx + 1 && e.status === "pending") return { ...e, status: "reviewing" as const }
        return e
      })
    )
    setSubmitting(false)
  }, [isStepReview, props, episodes])

  const handleEpisodeRetry = useCallback(async (epIdx: number) => {
    if (isStepReview) return
    setSubmitting(true)
    const ep = episodes[epIdx]
    await reviewEpisode((props as LegacyProps).projectId, ep.id, "retry")
    setSubmitting(false)
  }, [isStepReview, props, episodes])

  const handleDownload = useCallback(async (epId: string) => {
    await downloadEpisode(epId)
  }, [])

  // ===================================================================
  // ===== PROGRESS MODE (real project, waiting for review status) =====
  // ===================================================================
  const [progressStatus, setProgressStatus] = useState("Loading...")
  const [progressPolling, setProgressPolling] = useState(true)
  const [progressError, setProgressError] = useState<string | null>(null)
  const [progressCompleted, setProgressCompleted] = useState(false)
  const [progressVideoParts, setProgressVideoParts] = useState<Array<{ part: string; url: string }>>([])
  const [animatedPct, setAnimatedPct] = useState(0) // Smoothly animated percentage for progress bar

  // Animate progress bar percentage smoothly
  useEffect(() => {
    if (!isProgress || !progressPolling) return
    const STAGE_PCT: Record<string, number> = {
      "Loading...": 2,
      S1_Ingestion: 8, S1_Upload: 5,
      S2_Preproc: 15, S2_Brain: 30,
      S3_Bible: 45, S3_Bible_Check: 50,
      S4_Script: 55, S4_Visuals: 60,
      S5_Script: 65, S5_Script_Check: 70,
      S6_VO: 75, S6_Audio: 80,
      S7_Render: 85, S8_Render: 92,
      S9_Done: 100,
    }
    const targetPct = STAGE_PCT[progressStatus] ?? 5
    // Animate towards target
    const interval = setInterval(() => {
      setAnimatedPct((prev) => {
        if (prev >= targetPct) return targetPct
        // Increment by 0.5-1% each tick for smooth animation
        const step = Math.max(0.5, (targetPct - prev) * 0.08)
        return Math.min(prev + step, targetPct)
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isProgress, progressPolling, progressStatus])

  useEffect(() => {
    if (!isProgress) return
    const { jobRecordId, onReviewReady } = props as ProgressProps
    let consecutiveHits = 0
    let stopped = false
    let failCount = 0

    const poll = async () => {
      if (stopped) return
      try {
        const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(jobRecordId)}`)
        if (!res.ok) {
          failCount++
          console.log(`[v0] Progress poll FAILED: HTTP ${res.status} (fail #${failCount})`)
          if (failCount >= 3) {
            stopped = true
            setProgressPolling(false)
            setProgressError(`API returned ${res.status} after ${failCount} retries`)
          }
          return
        }
        failCount = 0
        const job = await res.json()
        console.log(`[v0] Progress poll | Status: ${job.Status} | Bible_R2_Key: ${job.Bible_R2_Key || "null"} | Script_R2_Key: ${job.Script_R2_Key || "null"}`)
        setProgressStatus(job.Status || "Unknown")

        // If done, stop polling and mark completed
        if (job.Status === "S9_Done") {
          stopped = true
          setProgressPolling(false)
          setProgressCompleted(true)
          // Fetch video parts
          if (job.Final_Video) {
            try {
              const videos = typeof job.Final_Video === "string"
                ? JSON.parse(job.Final_Video)
                : job.Final_Video
              setProgressVideoParts(videos || [])
            } catch { /* ignore parse errors */ }
          }
          return
        }
        if (["Error", "Failed"].includes(job.Status)) {
          stopped = true
          setProgressPolling(false)
          setProgressError(`Job ended with status: ${job.Status}`)
          return
        }

        // Strategy: if Bible_R2_Key exists, transition to step_review.
        // ReviewRoom auto-detects S5_Script_Check and fetches script separately.
        if (job.Bible_R2_Key) {
      console.log("[v0] TRANSITIONING to step_review! Status:", job.Status, "Bible_R2_Key:", job.Bible_R2_Key, "Work_Mode:", job.Work_Mode)
      stopped = true
      setProgressPolling(false)
      onReviewReady?.({ lockToken: job.Lock_Token || "", bibleR2Key: job.Bible_R2_Key, currentStatus: job.Status, workMode: job.Work_Mode || "Step_Review" })
          return
        }

        // No R2 key yet -- keep polling
        consecutiveHits++
        // After 30 polls (~2 min) with no R2 key, show timeout
        if (consecutiveHits >= 30) {
          stopped = true
          setProgressPolling(false)
          setProgressError(`Waited too long. Status: ${job.Status}. Please close and try again later.`)
          return
        }
      } catch (err) {
        failCount++
        console.log(`[v0] Progress poll exception (fail #${failCount}):`, err)
        if (failCount >= 3) {
          stopped = true
          setProgressPolling(false)
          setProgressError("Network error - could not reach backend")
        }
      }
    }

    console.log("[v0] Progress poller STARTED for record:", jobRecordId)
    poll()
    const interval = setInterval(poll, 4000)
    return () => { stopped = true; clearInterval(interval); console.log("[v0] Progress poller STOPPED") }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProgress])

  if (isProgress) {
    const { projectTitle, jobRecordId } = props as ProgressProps

  const STAGE_LABELS: Record<string, { label: string; pct: number }> = {
    S1_Ingestion: { label: "Ingesting source files...", pct: 8 },
    S1_Upload: { label: "Uploading to cloud...", pct: 5 },
    S2_Preproc: { label: "Preprocessing media...", pct: 15 },
    S2_Brain: { label: "AI is analyzing content...", pct: 30 },
    S3_Bible: { label: "Generating story bible...", pct: 45 },
    S3_Bible_Check: { label: "Bible ready! Opening review...", pct: 50 },
    S4_Script: { label: "Generating scripts...", pct: 55 },
    S4_Visuals: { label: "Creating visual assets...", pct: 60 },
    S5_Script: { label: "Finalizing scripts...", pct: 65 },
    S5_Script_Check: { label: "Scripts ready! Opening review...", pct: 70 },
    S6_VO: { label: "Generating voice over...", pct: 75 },
    S6_Audio: { label: "Processing audio...", pct: 80 },
    S7_Render: { label: "Rendering video...", pct: 85 },
    S8_Render: { label: "Final rendering in progress...", pct: 92 },
    S9_Done: { label: "Complete!", pct: 100 },
  }

    const info = STAGE_LABELS[progressStatus] || { label: progressStatus, pct: 0 }

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-5">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">Home</button>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{projectTitle}</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-center gap-6 px-6">
            {progressError ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <X className="h-10 w-10 text-red-400" />
                <p className="text-sm font-medium text-red-400">{progressError}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={onClose} className="rounded-lg border border-border/40 px-4 py-2 text-xs text-muted-foreground hover:bg-secondary/30">
                    Back to Home
                  </button>
                  <button
                    onClick={() => {
                      setProgressPolling(false)
                      const fn = (props as ProgressProps).onStop
                      if (fn) fn()
                      else onClose()
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Stop
                  </button>
                </div>
              </div>
            ) : progressCompleted ? (
              /* ===== COMPLETED STATE ===== */
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground">Complete!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {progressVideoParts.length} part{progressVideoParts.length !== 1 ? "s" : ""} ready
                  </p>
                </div>

                {/* Progress bar - 100% */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-emerald-400">Completed</span>
                    <span className="text-xs font-semibold tabular-nums text-emerald-400">100%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/30">
                    <div className="h-full w-full rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Action buttons for completed */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {progressVideoParts.length > 0 && (
                    <button
                      onClick={() => progressVideoParts.forEach((vp) => {
                        if (vp.url) {
                          const a = document.createElement("a")
                          a.href = vp.url
                          a.download = `part-${vp.part}.mp4`
                          a.click()
                        }
                      })}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/15 px-4 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary/30"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const fn = (props as ProgressProps).onPost
                      if (fn) fn(jobRecordId, progressVideoParts)
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-pink)]/40 bg-[var(--brand-pink)]/15 px-4 py-2.5 text-xs font-semibold text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)]/25"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Post to Discovery
                  </button>
                  <button
                    onClick={() => {
                      const fn = (props as ProgressProps).onDelete
                      if (fn) fn()
                      else onClose()
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="mt-2 text-xs text-muted-foreground/60 underline-offset-2 hover:underline"
                >
                  Back to Home
                </button>
              </>
            ) : (
              /* ===== PROCESSING STATE ===== */
              <>
            {progressPolling ? (
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-pink)]" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            )}

            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{progressStatus}</p>
              <p className="mt-1 text-sm text-muted-foreground">{info.label}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Processing...</span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{Math.round(animatedPct)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/30">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    progressPolling && "animate-progress-shimmer"
                  )}
                  style={{
                    width: `${Math.max(animatedPct, 3)}%`,
                    background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                  }}
                />
              </div>
            </div>

            {/* S8 special message */}
            {progressStatus === "S8_Render" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
                <p className="text-xs font-medium text-amber-400">Final Render Stage</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Video parts are being rendered. This may take several minutes.
                </p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50">
              {progressPolling ? "Auto-refreshing every few seconds..." : "Done"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-border/30 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setProgressPolling(false)
                  const fn = (props as ProgressProps).onStop
                  if (fn) fn()
                  else onClose()
                }}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <StopCircle className="h-3.5 w-3.5" />
                Stop
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===================================================================
  // ===== STEP REVIEW / REAL BIBLE RENDER =============================
  // ===================================================================
  if (isStepReview) {
    const projectTitle = (props as StepReviewProps).projectTitle

    // Loading
    if (bibleLoading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
            <p className="text-sm text-muted-foreground">Loading Bible JSON...</p>
          </div>
        </div>
      )
    }

    // Error -- show real error per spec, never fallback to mock
    if (bibleError) {
      const is404 = bibleError.includes("404") || bibleError.toLowerCase().includes("not found")
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-8">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium text-red-400">
              {is404 ? "File Not Ready / Missing R2 Asset" : "Failed to Load Asset"}
            </p>
            <p className="text-center text-xs text-muted-foreground">{bibleError}</p>
            <p className="text-center text-[10px] text-muted-foreground/60">
              R2 Key: {(props as StepReviewProps).bibleR2Key}
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg border border-border/30 px-4 py-2 text-xs text-foreground transition-colors hover:bg-secondary/30"
            >
              Close
            </button>
          </div>
        </div>
      )
    }

    if (!bible) return null

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* ===== GLOBAL ACTION LOCK OVERLAY (hidden on preview tab - preview has its own UI) ===== */}
        {actionLocked && activeTab !== "preview" && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border/20 bg-card px-10 py-8 shadow-2xl">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-pink)]" />
              <p className="text-sm font-semibold text-foreground">
                {actionMessage || "Processing, please wait..."}
              </p>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                {actionStatus === "submitting"
                  ? "Sending request to backend..."
                  : `Estimated ~${Math.round(estimateTimeoutMs() / 1000)}s. Do NOT close this page.`}
              </p>
              {/* Fake progress bar with percentage */}
              <div className="w-full">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${fakeProgress}%`,
                      background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                    }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{fakeProgress}%</p>
              </div>
              {/* Stop button */}
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <StopCircle className="h-3.5 w-3.5" />
                Stop
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-5">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
              Home
            </button>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{projectTitle || "Step Review"}</span>
            <Badge variant="outline" className={cn(
              "ml-2 text-[10px]",
              isCompleted
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
            )}>
              {isCompleted ? "Completed" : activeTab === "preview" ? "Phase 3: Final Preview" : activeTab === "voiceover" ? "Phase 2: Voice Over" : "Phase 1: Bible Review"}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Preview of characters (hidden on Final Preview tab) */}
          <div className={cn(
            "flex w-2/5 flex-col border-r border-border/20 bg-background p-6",
            activeTab === "preview" && "hidden"
          )}>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Characters ({bible.characters.length})
            </h4>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-3 pr-2">
                {bible.characters.map((char, i) => (
                  <CharacterCard
                    key={i}
                    char={char}
                    index={i}
                    editing={editMode}
                    onUpdate={updateCharacter}
                    onRemove={removeCharacter}
                  />
                ))}
                {editMode && (
                  <button
                    onClick={addCharacter}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/40 py-3 text-xs text-muted-foreground transition-colors hover:border-[var(--brand-pink)]/40 hover:text-[var(--brand-pink)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Character
                  </button>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT: Story Summary + Actions (full-width on Final Preview) */}
          <div className={cn(
            "flex flex-col",
            activeTab === "preview" ? "w-full" : "w-3/5"
          )}>
            {/* Phase step tabs with checkmarks and connectors */}
            <div className="flex shrink-0 items-center gap-0 border-b border-border/20 px-5 py-3">
              {/* Step 1: Story Bible */}
              <button
                onClick={() => setActiveTab("bible")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "bible" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70"
                )}
              >
                {approvedPhases.has("bible") ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Story Bible
                {approvedPhases.has("bible") && activeTab !== "bible" && (
                  <span className="ml-1 text-[9px] text-emerald-400/70">Done</span>
                )}
              </button>

              {/* Connector 1->2 */}
              <div className={cn(
                "mx-1.5 h-px w-6 transition-colors",
                approvedPhases.has("bible") ? "bg-emerald-500/40" : "bg-border/30"
              )} />

              {/* Step 2: Voice Over */}
              <button
                onClick={() => { if (scriptData || scriptPolling || scriptError || approvedPhases.has("bible")) setActiveTab("voiceover") }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "voiceover" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70",
                  !scriptData && !scriptPolling && !scriptError && !approvedPhases.has("bible") && "cursor-not-allowed opacity-50"
                )}
              >
                {approvedPhases.has("voiceover") ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                Voice Over
                {scriptPolling && <Loader2 className="ml-1 h-3 w-3 animate-spin text-[var(--brand-pink)]" />}
                {approvedPhases.has("voiceover") && activeTab !== "voiceover" && (
                  <span className="ml-1 text-[9px] text-emerald-400/70">Done</span>
                )}
              </button>

              {/* Connector 2->3 */}
              <div className={cn(
                "mx-1.5 h-px w-6 transition-colors",
                approvedPhases.has("voiceover") ? "bg-emerald-500/40" : "bg-border/30"
              )} />

              {/* Step 3: Final Preview */}
              <button
                onClick={() => { if (videoParts.length > 0 || videoPolling || videoError || approvedPhases.has("voiceover") || isCompleted) setActiveTab("preview") }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "preview" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70",
                  !videoParts.length && !videoPolling && !videoError && !approvedPhases.has("voiceover") && !isCompleted && "cursor-not-allowed opacity-50"
                )}
              >
                {approvedPhases.has("preview") ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Film className="h-3.5 w-3.5" />
                )}
                Final Preview
                {approvedPhases.has("preview") && activeTab !== "preview" && (
                  <span className="ml-1 text-[9px] text-emerald-400/70">Done</span>
                )}
                {videoPolling && <Loader2 className="ml-1 h-3 w-3 animate-spin text-[var(--brand-pink)]" />}
              </button>
            </div>

            {/* ====== FINAL PREVIEW TAB (full width, outside ScrollArea) ====== */}
            {activeTab === "preview" && (() => {
              const selectedVp = videoParts.find((vp) => vp.part === selectedVideoPartId) || null
              const readyCount = videoParts.filter((vp) => !!vp.url && !vp.redoing).length
              const totalParts = Math.max(videoParts.length, episodeCount, 1)
              const allDone = videoParts.length > 0 && videoParts.every((vp) => !!vp.url && !vp.redoing)
              const overallPct = videoParts.length === 0
                ? videoRenderProgress
                : Math.round((readyCount / totalParts) * 100)
              const skeletonCount = Math.max(episodeCount, 3)

              return (
                <div className="flex flex-1 overflow-hidden">
                  {/* ── LEFT: Video Player + Progress + Stop ── */}
                  <div className="flex flex-1 flex-col p-4 gap-3">
                    {/* Video player / placeholder */}
                    <div className="relative flex flex-1 items-center justify-center rounded-xl border border-border/10 bg-black/60 overflow-hidden min-h-[320px]">
                      {selectedVp?.url && !selectedVp.redoing ? (
                        <video
                          key={selectedVp.url}
                          controls
                          autoPlay
                          preload="metadata"
                          className="h-full w-full object-contain"
                          src={selectedVp.url}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : videoStopped ? (
                        <div className="flex flex-col items-center gap-4 px-8">
                          <StopCircle className="h-12 w-12 text-red-400/60" />
                          <p className="text-sm font-medium text-foreground/80">Rendering stopped</p>
                          <p className="max-w-xs text-center text-xs text-muted-foreground">
                            {videoParts.length > 0
                              ? `${readyCount} of ${totalParts} parts were completed before stopping.`
                              : "No video parts were completed."}
                          </p>
                          <button
                            onClick={handleRetryVideo}
                            disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                            title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 px-4 py-2 text-xs font-medium text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retry Rendering
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 px-8">
                          <div className="relative h-16 w-16">
                            <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-pink)]/20" />
                            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--brand-pink)]" />
                            <Film className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[var(--brand-pink)]/60" />
                          </div>
                          <p className="text-sm font-medium text-foreground/80">Rendering videos...</p>
                          <p className="max-w-xs text-center text-xs text-muted-foreground">
                            Each part renders independently. Select a completed part from the right panel to preview it here.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom bar: progress + action buttons (always visible, never pushed off-screen) */}
                    <div className="shrink-0 flex flex-col gap-2 border-t border-border/15 pt-3">
                      {/* Progress row */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-muted-foreground">
                              {videoStopped
                                ? "Stopped"
                                : allDone
                                  ? `All ${videoParts.length} parts rendered`
                                  : videoParts.length > 0
                                    ? `${readyCount} of ${totalParts} parts ready`
                                    : "Rendering in progress..."}
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-foreground">{overallPct}%</span>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/30">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${overallPct}%`,
                                background: videoStopped
                                  ? "rgb(248 113 113)"
                                  : allDone
                                    ? "rgb(52 211 153)"
                                    : "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                              }}
                            />
                          </div>
                        </div>
                        {/* Inline action buttons */}
                        <div className="flex shrink-0 items-center gap-2">
                          {isCompleted && videoParts.some((vp) => vp.url) && (
                            <button
                              onClick={() => videoParts.forEach((vp) => { if (vp.url) handleVideoDownload(vp.url, vp.part) })}
                              className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/15 px-4 py-1.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-secondary/30"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </button>
                          )}
                          {isCompleted && isStepReview && (
                            <button
                              onClick={() => {
                                const { jobRecordId } = props as StepReviewProps
                                ;(props as StepReviewProps).onPost?.(jobRecordId, videoParts.map((vp) => ({ part: vp.part, url: vp.url })))
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-pink)]/40 bg-[var(--brand-pink)]/15 px-4 py-1.5 text-[11px] font-semibold text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)]/25"
                            >
                              <Send className="h-3 w-3" />
                              Post to Discovery
                            </button>
                          )}
                          {videoPolling && !videoStopped && (
                            <button
                              onClick={handleStop}
                              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                            >
                              <StopCircle className="h-3 w-3" />
                              Stop
                            </button>
                          )}
                          <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                            Close
                          </button>
                        </div>
                      </div>
                      {allDone && (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          All parts rendered successfully
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── RIGHT: Video Parts List ── */}
                  <div className="flex w-[340px] flex-shrink-0 flex-col border-l border-border/20">
                    {/* Panel header */}
                    <div className="flex items-center justify-between border-b border-border/15 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Film className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Video Parts</h3>
                        {videoParts.length > 0 && (
                          <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {readyCount}/{totalParts} ready
                          </span>
                        )}
                      </div>
                      {isCompleted ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </span>
                      ) : videoPolling && !videoStopped ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-[var(--brand-pink)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--brand-pink)]">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-pink)] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-pink)]" />
                          </span>
                          Rendering
                        </span>
                      ) : null}
                    </div>

                    {/* Error banner */}
                    {videoError && (
                      <div className="mx-3 mt-3 flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                          <p className="flex-1 text-[11px] text-red-400">{videoError}</p>
                          <button
                            onClick={() => setVideoError(null)}
                            className="shrink-0 rounded p-0.5 text-red-400/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
                            aria-label="Dismiss error"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <button
                            onClick={handleRetryVideo}
                            disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                            title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                            className="flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1 text-[10px] font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Retry
                          </button>
                          <button
                            onClick={() => { setVideoError(null) }}
                            className="flex items-center gap-1 rounded-md bg-secondary/20 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary/30"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scrollable parts list */}
                    <ScrollArea className="flex-1 p-3">
                      <div className="flex flex-col gap-2">
                        {/* Skeleton cards (before any parts arrive) */}
                        {videoParts.length === 0 && !videoError && !videoStopped &&
                          Array.from({ length: skeletonCount }).map((_, i) => {
                            const skeletonPct = Math.min(videoRenderProgress + i * 3, 90)
                            return (
                              <div key={i} className="rounded-lg border border-border/15 bg-secondary/10 p-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/25">
                                    <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-pink)]/50" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-semibold text-foreground/60">Part {i + 1}</span>
                                      <span className="text-[9px] font-medium text-muted-foreground/50">Rendering</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/25">
                                      <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                          width: `${skeletonPct}%`,
                                          background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                                          opacity: 0.5,
                                        }}
                                      />
                                    </div>
                                    <span className="mt-0.5 block text-[9px] tabular-nums text-muted-foreground/40">{skeletonPct}%</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        }

                        {/* Real part cards */}
                        {videoParts.map((vp) => {
                          const isSelected = vp.part === selectedVideoPartId
                          const hasUrl = !!vp.url && !vp.redoing
                          const partPct = vp.approved ? 100 : hasUrl ? 100 : vp.redoing ? 35 : 60

                          return (
                            <div
                              key={vp.part}
                              onClick={() => { if (hasUrl) setSelectedVideoPartId(vp.part) }}
                              className={cn(
                                "rounded-lg border p-3 transition-all",
                                isSelected
                                  ? "border-[var(--brand-pink)]/40 bg-[var(--brand-pink)]/8 ring-1 ring-[var(--brand-pink)]/20"
                                  : "border-border/15 bg-secondary/8 hover:bg-secondary/15",
                                hasUrl ? "cursor-pointer" : "cursor-default"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {/* Status icon */}
                                <div className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                  vp.approved ? "bg-emerald-500/15" : hasUrl ? "bg-[var(--brand-pink)]/10" : "bg-secondary/20"
                                )}>
                                  {vp.redoing ? (
                                    <Loader2 className="h-4.5 w-4.5 animate-spin text-amber-400" />
                                  ) : vp.approved ? (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                                  ) : hasUrl ? (
                                    <Play className="h-4.5 w-4.5 text-[var(--brand-pink)]" />
                                  ) : (
                                    <Loader2 className="h-4.5 w-4.5 animate-spin text-muted-foreground/50" />
                                  )}
                                </div>

                                {/* Part info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-foreground">Part {vp.part}</span>
                                    <span className={cn(
                                      "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                      vp.approved
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : vp.redoing
                                          ? "bg-amber-500/15 text-amber-400"
                                          : hasUrl
                                            ? "bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                                            : "bg-secondary/20 text-muted-foreground/60"
                                    )}>
                                      {vp.approved ? "Approved" : vp.redoing ? "Redoing" : hasUrl ? "Ready" : "Rendering"}
                                    </span>
                                  </div>

                                  {/* Per-part progress bar */}
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/25">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-500 ease-out",
                                        !hasUrl && !vp.approved && !vp.redoing && "animate-progress-shimmer"
                                      )}
                                      style={{
                                        width: `${partPct}%`,
                                        background: vp.approved
                                          ? "rgb(52 211 153)"
                                          : vp.redoing
                                            ? "rgb(251 191 36)"
                                            : hasUrl
                                              ? "var(--brand-pink)"
                                              : "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                                      }}
                                    />
                                  </div>
                                  <span className="mt-0.5 block text-[9px] tabular-nums text-muted-foreground/60">{partPct}%</span>
                                </div>
                              </div>

                              {/* Per-part action buttons */}
                              {hasUrl && (
                                <div className="mt-2.5 flex items-center gap-2 pl-[52px]" onClick={(e) => e.stopPropagation()}>
                                  {isCompleted || vp.approved ? (
                                    <button
                                      onClick={() => handleVideoDownload(vp.url, vp.part)}
                                      className="flex items-center gap-1.5 rounded-md border border-border/25 bg-secondary/15 px-3 py-1.5 text-[10px] font-medium text-foreground/70 transition-colors hover:bg-secondary/30"
                                    >
                                      <Download className="h-3 w-3" />
                                      Download
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleVideoPartRedo(vp.part)}
                                        disabled={isFullAuto || isAutoFlowPhase}
                                        title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                                        className="flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                        Redo
                                      </button>
                                      <button
                                        onClick={() => handleVideoPartApprove(vp.part)}
                                        className="flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        Approve
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )
            })()}

            <ScrollArea className={cn("flex-1 px-5 py-4", activeTab === "preview" && "hidden")}>
              {/* ====== BIBLE TAB ====== */}
              {activeTab === "bible" && (
                <div className="flex flex-col gap-5">
                  {/* Story Summary */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">
                        Story Summary
                        {!editMode && (
                          approvedPhases.has("bible")
                            ? <span className="ml-2 text-[10px] font-normal text-emerald-400">Approved</span>
                            : <span className="ml-2 text-[10px] font-normal text-amber-400">Pending Confirmation</span>
                        )}
                      </h3>
                      {!editMode && !approvedPhases.has("bible") && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-1 text-[10px] text-[var(--brand-pink)] transition-colors hover:text-[var(--brand-pink)]/70"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>

                    {editMode ? (
                      <textarea
                        value={bible.story_summary}
                        onChange={(e) => updateStorySummary(e.target.value)}
                        className="min-h-[180px] w-full resize-none rounded-lg border border-[var(--brand-pink)]/30 bg-secondary/15 px-4 py-3 text-sm leading-relaxed text-foreground/90 outline-none transition-colors focus:border-[var(--brand-pink)]/50"
                      />
                    ) : (
                      <div className="rounded-lg border border-border/20 bg-secondary/10 px-4 py-3">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                          {bible.story_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Episodes */}
                  {bible.episodes && bible.episodes.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">
                        Episodes ({bible.episodes.length})
                      </h3>
                      <div className="flex flex-col gap-3">
                        {bible.episodes.map((ep, i) => (
                          <div key={i} className={cn(
                            "rounded-lg border px-4 py-3",
                            editMode ? "border-[var(--brand-pink)]/20 bg-secondary/5" : "border-border/20 bg-secondary/10"
                          )}>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                                {ep.key}
                              </span>
                              {editMode ? (
                                <input
                                  value={ep.setting || ""}
                                  onChange={(e) => updateEpisode(i, "setting", e.target.value)}
                                  placeholder="Location / Setting"
                                  className="flex-1 rounded border border-border/30 bg-secondary/20 px-2 py-0.5 text-[10px] text-muted-foreground outline-none focus:border-[var(--brand-pink)]/40"
                                />
                              ) : ep.setting && (
                                <span className="text-[10px] text-muted-foreground">{ep.setting}</span>
                              )}
                            </div>
                            {editMode ? (
                              <textarea
                                value={ep.summary}
                                onChange={(e) => updateEpisode(i, "summary", e.target.value)}
                                className="mb-2 min-h-[80px] w-full resize-none rounded border border-border/30 bg-secondary/20 px-3 py-2 text-xs leading-relaxed text-foreground/80 outline-none focus:border-[var(--brand-pink)]/40"
                              />
                            ) : (
                              <p className="text-xs leading-relaxed text-foreground/70">{ep.summary}</p>
                            )}
                            {(ep.visual_anchors && ep.visual_anchors.length > 0 || editMode) && (
                              <div className="mt-2 border-t border-border/10 pt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Visual Anchors</span>
                                  {editMode && (
                                    <button
                                      onClick={() => addVisualAnchor(i)}
                                      className="text-[9px] text-[var(--brand-pink)] hover:underline"
                                    >
                                      + Add Anchor
                                    </button>
                                  )}
                                </div>
                                <ul className="mt-1 flex flex-col gap-1">
                                  {(ep.visual_anchors || []).map((anchor, j) => (
                                    <li key={j} className="flex items-center gap-1">
                                      {editMode ? (
                                        <>
                                          <input
                                            value={anchor}
                                            onChange={(e) => updateEpisodeVisualAnchor(i, j, e.target.value)}
                                            className="flex-1 rounded border border-border/30 bg-secondary/20 px-2 py-1 text-[10px] leading-relaxed text-foreground/60 outline-none focus:border-[var(--brand-pink)]/40"
                                          />
                                          <button
                                            onClick={() => removeVisualAnchor(i, j)}
                                            className="text-red-400/60 hover:text-red-400"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-[10px] leading-relaxed text-foreground/50">{anchor}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ====== VOICE OVER TAB ====== */}
              {activeTab === "voiceover" && (
                <div className="flex flex-col gap-5">
                  {/* Polling / Loading state */}
                  {scriptPolling && !scriptData && !scriptError && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/20 bg-secondary/10 px-6 py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
                      <p className="text-center text-sm font-medium text-foreground/80">
                        AI Director is crafting the storyboard & voice-over script...
                      </p>
                      <p className="text-center text-xs text-muted-foreground">
                        This usually takes 1~3 minutes. Please wait...
                      </p>
                      <div className="w-48">
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${fakeProgress}%`,
                              background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                            }}
                          />
                        </div>
                        <p className="mt-1 text-right text-[10px] text-muted-foreground">{fakeProgress}%</p>
                      </div>
                      <button
                        onClick={handleStop}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        <StopCircle className="h-3.5 w-3.5" />
                        Stop
                      </button>
                    </div>
                  )}

                  {/* Error state */}
                  {scriptError && (
                    <div className="relative flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-8">
                      <button
                        onClick={() => setScriptError(null)}
                        className="absolute right-3 top-3 rounded-md p-1 text-red-400/60 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        aria-label="Dismiss error"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-center text-sm font-semibold text-red-400">Generation Failed</p>
                      <p className="text-center text-xs text-red-400/70">{scriptError}</p>
                      <button
                        onClick={handleRetry}
                        disabled={actionLocked}
                        className="mt-1 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Empty state: no data, not polling, no error */}
                  {!scriptPolling && !scriptData && !scriptError && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/20 bg-secondary/10 px-6 py-20">
                      <Mic className="h-12 w-12 text-muted-foreground/40" />
                      <p className="text-center text-base font-semibold text-foreground/80">
                        No voice over content
                      </p>
                      <p className="max-w-sm text-center text-sm text-muted-foreground">
                        The voice over generation was stopped or has not started yet.
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleRetry}
                          disabled={actionLocked}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-pink)]/40 bg-[var(--brand-pink)]/10 px-5 py-2.5 text-sm font-medium text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)]/20 disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Retry
                        </button>
                        <button
                          onClick={onClose}
                          className="flex items-center gap-1.5 rounded-lg border border-border/30 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Script content — parts / timeline */}
                  {scriptData && scriptData.parts.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Voice Over Script ({scriptData.parts.length} part{scriptData.parts.length !== 1 ? "s" : ""})
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Review the AI-generated voice-over. You can edit the narration text directly.
                        </p>
                      </div>
                      {scriptData.parts.map((part, partIdx) => (
                        <div key={partIdx} className="flex flex-col gap-2">
                          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                            <span className="rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-bold">
                              Part {part.part_id}
                            </span>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {part.timeline.length} event{part.timeline.length !== 1 ? "s" : ""}
                            </span>
                          </h4>
                          {part.timeline.map((evt, evtIdx) => (
                            <div key={evtIdx} className="rounded-lg border border-border/20 bg-secondary/10 px-4 py-3">
                              {/* Event type badge */}
                              <div className="mb-2 flex items-center gap-2">
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                  evt.type.includes("VO") ? "bg-[var(--brand-pink)]/15 text-[var(--brand-pink)]"
                                    : evt.type === "ORIGINAL_SOUND" ? "bg-amber-500/15 text-amber-400"
                                    : "bg-secondary/40 text-foreground/60"
                                )}>
                                  {evt.type}
                                </span>
                              </div>
                              {/* Voice-over text (editable) */}
                              {(evt.type.includes("VO") || evt.text) && (
                                <div className="mb-2">
                                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Narration {editMode && <span className="normal-case text-[var(--brand-pink)]">(editable)</span>}
                                  </span>
                                  {editMode ? (
                                    <textarea
                                      value={evt.text}
                                      onChange={(e) => updateVOText(partIdx, evtIdx, e.target.value)}
                                      rows={Math.max(2, Math.ceil(evt.text.length / 80))}
                                      className="mt-1 w-full resize-none rounded-md border border-[var(--brand-pink)]/30 bg-secondary/15 px-3 py-2 text-xs leading-relaxed text-foreground/90 outline-none transition-colors focus:border-[var(--brand-pink)]/50"
                                    />
                                  ) : (
                                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
                                      {evt.text || <span className="italic text-muted-foreground">No text</span>}
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Visual query (read-only) */}
                              {evt.visual_query && (
                                <div className="mb-2">
                                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Visual</span>
                                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{evt.visual_query}</p>
                                </div>
                              )}
                              {/* Description for ORIGINAL_SOUND (read-only) */}
                              {evt.description && (
                                <div>
                                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Description</span>
                                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{evt.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Final Preview tab content is rendered above, outside ScrollArea */}
            </ScrollArea>

            {/* Action Status (hidden on preview - preview has its own UI) */}
            {actionStatus !== "idle" && activeTab !== "preview" && (
              <div className={cn(
                "mx-5 mb-2 rounded-lg px-4 py-2 text-xs",
                actionStatus === "submitting" && "border border-border/30 bg-secondary/20 text-muted-foreground",
                actionStatus === "success" && "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                actionStatus === "error" && "border border-red-500/30 bg-red-500/10 text-red-400",
              )}>
                <div className="flex items-center gap-2">
                  {actionStatus === "submitting" && <Loader2 className="h-3 w-3 animate-spin" />}
                  {actionStatus === "success" && <CheckCircle2 className="h-3 w-3" />}
                  {actionStatus === "error" && <AlertCircle className="h-3 w-3" />}
                  <span className="flex-1">{actionMessage}</span>
                  {(actionStatus === "error" || actionStatus === "success") && (
                    <button
                      onClick={() => { setActionStatus("idle"); setActionMessage("") }}
                      className="shrink-0 rounded p-0.5 transition-colors hover:bg-foreground/10"
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar (hidden on preview tab - preview has its own controls) */}
            <div className={cn("shrink-0 border-t border-border/20 px-5 py-3", activeTab === "preview" && "hidden")}>
              {/* ---- Completed: read-only, just show close ---- */}
              {isCompleted ? (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All phases completed
                  </span>
                  <div className="flex items-center gap-2">
                    {videoParts.some((vp) => vp.url) && (
                      <button
                        onClick={() => videoParts.forEach((vp) => { if (vp.url) handleVideoDownload(vp.url, vp.part) })}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/15 px-4 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary/30"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                      Close
                    </button>
                  </div>
                </div>
              ) : <>
              {/* ---- Bible Tab Actions ---- */}
              {activeTab === "bible" && (
                <>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEdit}
                        disabled={actionLocked}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAndContinue}
                        disabled={actionLocked}
                        className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {actionLocked ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Save & Continue
                      </button>
                    </div>
                  ) : approvedPhases.has("bible") ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approved
                      </span>
                      <button disabled className="flex items-center gap-1.5 rounded-lg border border-border/20 bg-secondary/10 px-4 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Redo
                      </button>
                      <button disabled className="flex items-center gap-1.5 rounded-lg border border-border/20 bg-secondary/10 px-4 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStop}
                        disabled={actionLocked}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <StopCircle className="h-3.5 w-3.5" />
                        Stop
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                        title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Redo
                      </button>
                      <button
                        onClick={() => setEditMode(true)}
                        disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                        title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                        title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                        className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLocked ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ---- Voice Over Tab Actions ---- */}
              {activeTab === "voiceover" && (
                <div className="flex items-center gap-2">
                  {scriptPolling ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-pink)]" />
                      Waiting for script generation...
                    </p>
                  ) : scriptData ? (
                    <>
                      {editMode ? (
                        <>
                          <button
                            onClick={() => setEditMode(false)}
                            disabled={actionLocked}
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleVOSaveAndContinue}
                            disabled={actionLocked}
                            className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {actionLocked ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Save & Continue
                          </button>
                        </>
                      ) : approvedPhases.has("voiceover") ? (
                        <>
                          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </span>
                          <button disabled className="flex items-center gap-1.5 rounded-lg border border-border/20 bg-secondary/10 px-4 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Redo
                          </button>
                          <button disabled className="flex items-center gap-1.5 rounded-lg border border-border/20 bg-secondary/10 px-4 py-2.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleStop}
                            disabled={actionLocked}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                            Stop
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                            title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Redo
                          </button>
                          <button
                            onClick={() => setEditMode(true)}
                            disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                            title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={handleApprove}
                            disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                            title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                            className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLocked ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>
                        </>
                      )}
                    </>
                  ) : scriptError ? (
                    <button
                      onClick={handleRetry}
                      disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                      title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleRetry}
                        disabled={actionLocked || isFullAuto || isAutoFlowPhase}
                        title={isFullAuto ? "Disabled in Full Auto mode" : undefined}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 px-4 py-2.5 text-xs font-medium text-[var(--brand-pink)] transition-colors hover:bg-[var(--brand-pink)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                      <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
                      >
                        <X className="h-3.5 w-3.5" />
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}

              </>}
              {/* ---- Final Preview Tab Actions ---- */}
              {activeTab === "preview" && (
                <div className="flex items-center gap-2">
                  {videoParts.every((vp) => vp.approved) && videoParts.length > 0 ? (
                    <p className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      All {videoParts.length} parts approved
                    </p>
                  ) : videoParts.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {videoParts.filter((vp) => vp.approved).length} / {videoParts.length} approved
                    </p>
                  ) : videoPolling ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-pink)]" />
                      Rendering videos...
                    </p>
                  ) : null}
                  {videoPolling && (
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                    >
                      <StopCircle className="h-3 w-3" />
                      Stop
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===================================================================
  // ===== LEGACY RENDER (unchanged) ===================================
  // ===================================================================
  const isReadOnly = project?.status === "completed"
  // For legacy/placeholder cards, never block UI with processing spinner.
  // isProcessing only applies to real projects in progress mode (handled above).
  const isProcessing = false
  const finalized = episodes.filter((e) => e.status === "locked").length
  const currentEp = episodes[selectedEp] || null

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
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-colors hover:bg-secondary/40 hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: 9:16 Player */}
        <div className="flex w-2/5 flex-col items-center justify-center border-r border-border/20 bg-background p-6">
          <div className="relative flex aspect-[9/16] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border border-border/25 ring-1 ring-inset ring-[hsla(0,0%,100%,0.04)]" style={{ backgroundImage: PLAYER_BG }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
            {isProcessing ? (
              <div className="relative z-10 flex flex-col items-center gap-3 rounded-xl bg-background/40 px-6 py-5 backdrop-blur-md">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-pink)]" />
                <p className="text-xs font-medium text-foreground/80">AI Processing...</p>
                <div className="relative h-1 w-24 overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                  <div className="absolute inset-y-0 left-0 w-1/3 animate-[progress-slide_1.8s_ease-in-out_infinite] rounded-full bg-[var(--brand-pink)]" />
                </div>
              </div>
            ) : phase === 3 && currentEp ? (
              <button onClick={() => setPlayingEp(!playingEp)} className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-background/30 backdrop-blur-sm transition-transform hover:scale-110">
                {playingEp ? <Pause className="h-6 w-6 text-foreground/80" /> : <Play className="ml-1 h-6 w-6 text-foreground/80" />}
              </button>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Film className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-[10px] text-muted-foreground/50">Preview Area</p>
              </div>
            )}
            {phase === 3 && currentEp && (
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background/90 to-transparent px-4 pb-4 pt-8">
                <p className="text-center text-xs font-medium text-foreground">EP{String(currentEp.number).padStart(2, "0")}</p>
                <p className="mt-0.5 text-center text-[10px] text-muted-foreground">{currentEp.status === "locked" ? "Finalized" : currentEp.status === "reviewing" ? "Under Review" : "Pending"}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Operation Area */}
        <div className="flex w-3/5 flex-col">
          <div className="flex shrink-0 items-center gap-1 border-b border-border/20 px-5 py-3">
            {[
              { n: 1 as Phase, label: "Story Synopsis", icon: FileText, done: synopsisConfirmed },
              { n: 2 as Phase, label: "Voice Over", icon: Mic, done: voiceConfirmed },
              { n: 3 as Phase, label: "Final Preview", icon: Film, done: episodes.every((e) => e.status === "locked") },
            ].map((step, i) => {
              const StepIcon = step.icon
              const isActive = phase === step.n
              return (
                <div key={step.n} className="flex items-center">
                  {i > 0 && <div className={cn("mx-2 h-px w-6", step.done ? "bg-[hsl(var(--success))]" : "bg-border/30")} />}
                  <button
                    onClick={() => { if (!isProcessing) setPhase(step.n) }}
                    disabled={isProcessing}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      isActive ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70",
                      step.done && !isActive && "text-[hsl(var(--success))]"
                    )}
                  >
                    {step.done && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    {step.label}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex shrink-0 gap-1 px-5 pt-2">
            <div className={cn("h-1 flex-1 rounded-full", synopsisConfirmed ? "bg-[hsl(var(--success))]" : phase === 1 ? "brand-gradient" : "bg-secondary/30")} />
            <div className={cn("h-1 flex-1 rounded-full", voiceConfirmed ? "bg-[hsl(var(--success))]" : phase === 2 ? "brand-gradient" : "bg-secondary/30")} />
            <div className={cn("h-1 flex-1 rounded-full", episodes.every((e) => e.status === "locked") ? "bg-[hsl(var(--success))]" : phase === 3 ? "brand-gradient" : "bg-secondary/30")} />
          </div>
          <ScrollArea className="flex-1 px-5 py-4">
            {isProcessing && (
              <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-border/20 bg-secondary/10 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
                <p className="text-sm font-medium text-foreground/80">AI is processing your project...</p>
                <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                  <div className="absolute inset-y-0 left-0 w-1/3 animate-[progress-slide_1.8s_ease-in-out_infinite] rounded-full bg-[var(--brand-pink)]" />
                </div>
                <p className="text-[10px] text-muted-foreground">This may take a few minutes</p>
              </div>
            )}
            {!isProcessing && phase === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Story Synopsis</h3>
                    <p className="text-xs text-muted-foreground">Review the overall narrative direction.</p>
                  </div>
                  {synopsisConfirmed && (
                    <Badge variant="outline" className="border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-xs text-[hsl(var(--success))]">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
                    </Badge>
                  )}
                </div>
                {synopsisEditing ? (
                  <textarea value={synopsisText} onChange={(e) => setSynopsisText(e.target.value)} className="min-h-[200px] resize-none rounded-lg border border-[var(--brand-pink)]/30 bg-secondary/15 px-4 py-3 text-sm leading-relaxed text-foreground/90 outline-none transition-colors focus:border-[var(--brand-pink)]/50" />
                ) : (
                  <div className="rounded-lg border border-border/20 bg-secondary/10 px-4 py-3">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{synopsisText}</p>
                  </div>
                )}
                {!isReadOnly && !synopsisConfirmed && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSynopsisEditing(!synopsisEditing)} className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40">
                      <Edit3 className="h-3.5 w-3.5" />{synopsisEditing ? "Done Editing" : "Edit"}
                    </button>
                    <button onClick={handleSynopsisConfirm} disabled={submitting} className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" />Confirm Synopsis
                    </button>
                  </div>
                )}
                {synopsisConfirmed && !isReadOnly && (
                  <button onClick={handleSynopsisRetry} disabled={submitting} className="flex w-fit items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50">
                    <RotateCcw className="h-3.5 w-3.5" />Retry
                  </button>
                )}
              </div>
            )}
            {!isProcessing && phase === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Voice Over</h3>
                    <p className="text-xs text-muted-foreground">Review AI-generated voiceover scripts per episode.</p>
                  </div>
                  {voiceConfirmed && (
                    <Badge variant="outline" className="border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-xs text-[hsl(var(--success))]">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {voiceTexts.map((text, i) => (
                    <div key={i} className="rounded-lg border border-border/20 bg-secondary/10 transition-all hover:border-border/40">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">EP{String(i + 1).padStart(2, "0")}</span>
                        {!isReadOnly && !voiceConfirmed && (
                          <button onClick={() => setEditingVoice(editingVoice === i ? null : i)} className="flex items-center gap-1 text-[10px] text-[var(--brand-pink)] transition-colors hover:text-[var(--brand-pink)]/70">
                            {editingVoice === i ? <><CheckCircle2 className="h-3 w-3" /> Done</> : <><Edit3 className="h-3 w-3" /> Edit</>}
                          </button>
                        )}
                      </div>
                      {editingVoice === i ? (
                        <textarea value={text} onChange={(e) => { const next = [...voiceTexts]; next[i] = e.target.value; setVoiceTexts(next) }} className="w-full resize-none border-t border-border/20 bg-transparent px-3 py-2 text-xs leading-relaxed text-foreground/80 outline-none" rows={6} />
                      ) : (
                        <p className="line-clamp-2 px-3 pb-2 text-xs text-foreground/60">{text.split("\n")[0]}...</p>
                      )}
                    </div>
                  ))}
                </div>
                {!isReadOnly && !voiceConfirmed && (
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={handleVoiceRetry} disabled={submitting} className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50">
                      <RotateCcw className="h-3.5 w-3.5" />Retry
                    </button>
                    <button onClick={handleVoiceConfirm} disabled={submitting} className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" />Confirm Voice Over
                    </button>
                  </div>
                )}
                {voiceConfirmed && !isReadOnly && (
                  <button onClick={handleVoiceRetry} disabled={submitting} className="flex w-fit items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50">
                    <RotateCcw className="h-3.5 w-3.5" />Retry
                  </button>
                )}
              </div>
            )}
            {!isProcessing && phase === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Final Preview</h3>
                  <p className="text-xs text-muted-foreground">Review each episode.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {episodes.map((ep, i) => (
                    <button key={ep.id} onClick={() => setSelectedEp(i)} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all", selectedEp === i ? "brand-gradient text-[#fff] brand-glow-sm" : ep.status === "locked" ? "border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : ep.status === "reviewing" ? "border border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]" : "border border-border/30 bg-secondary/20 text-muted-foreground")}>
                      {ep.status === "locked" && selectedEp !== i ? <Lock className="h-3 w-3" /> : ep.number}
                    </button>
                  ))}
                </div>
                {currentEp && (
                  <div className="rounded-xl border border-border/25 bg-secondary/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">EP{String(currentEp.number).padStart(2, "0")}</span>
                        <Badge variant="outline" className={cn("text-[9px]", currentEp.status === "locked" && "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]", currentEp.status === "reviewing" && "border-[var(--brand-pink)]/30 text-[var(--brand-pink)]", currentEp.status === "pending" && "border-border/30 text-muted-foreground")}>
                          {currentEp.status === "locked" ? "Finalized" : currentEp.status === "reviewing" ? "Under Review" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    {currentEp.status === "locked" ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(currentEp.id)} className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-purple)]/30 bg-[var(--brand-purple)]/10 px-4 py-2.5 text-xs font-medium text-[var(--brand-purple)] transition-colors hover:bg-[var(--brand-purple)]/20">
                          <Download className="h-3.5 w-3.5" />Download
                        </button>
                        <button onClick={() => handleEpisodeRetry(selectedEp)} disabled={submitting} className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50">
                          <RotateCcw className="h-3.5 w-3.5" />Retry
                        </button>
                      </div>
                    ) : currentEp.status === "reviewing" && !isReadOnly ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEpisodeRetry(selectedEp)} disabled={submitting} className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50">
                          <RotateCcw className="h-3.5 w-3.5" />Retry
                        </button>
                        <button onClick={() => handleEpisodeApprove(selectedEp)} disabled={submitting} className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50">
                          <CheckCircle2 className="h-3.5 w-3.5" />Approve & Lock
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60">{currentEp.status === "pending" ? "Waiting for previous episodes." : "View-only."}</p>
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
