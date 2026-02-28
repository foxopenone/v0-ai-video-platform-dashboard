"use client"

import { useState, useEffect, useCallback } from "react"
import {
  X, ChevronRight, Loader2, Play, Pause, RotateCcw,
  CheckCircle2, Download, Lock, FileText, Mic, Film,
  Edit3, Plus, Trash2, User, AlertCircle
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
  currentStatus: string // e.g. "S3_Bible_Check" | "S5_Script_Check"
  projectTitle?: string
  onClose: () => void
  onApproved?: () => void
  onDelete?: () => void
}

// ---------- Progress Props (real project, not yet in review status) ----------
interface ProgressProps {
  mode: "progress"
  jobRecordId: string
  projectTitle: string
  onClose: () => void
  onDelete?: () => void
  /** Called when status reaches a Check state -- parent should switch to step_review */
  onReviewReady?: (data: { lockToken: string; bibleR2Key: string; currentStatus: string }) => void
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
  // Voice Over (Script) state for step_review
  type ReviewTab = "bible" | "voiceover" | "preview"
  const [activeTab, setActiveTab] = useState<ReviewTab>("bible")
  const [scriptPolling, setScriptPolling] = useState(false)
  const [scriptData, setScriptData] = useState<ScriptJSON | null>(null)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [scriptR2Key, setScriptR2Key] = useState<string | null>(null)
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

  // ── Step Review: Load Bible JSON ──
  useEffect(() => {
    if (!isStepReview) return
    const { bibleR2Key, jobRecordId, currentStatus } = props as StepReviewProps

    console.log("[v0] 1. Airtable Status:", currentStatus)
    console.log("[v0] 2. Bible_R2_Key:", bibleR2Key)

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

    // If status is already S5_Script_Check, auto-switch to Voice Over tab
    if (/^S5_Script/i.test(currentStatus)) {
      console.log("[v0] Status is S5_Script -- auto-switching to Voice Over tab")
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
  }, [isStepReview, isStepReview ? (props as StepReviewProps).bibleR2Key : null])

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
    if (!scriptData?._raw || !scriptR2Key) return
    const info = getCallbackInfo()
    if (!info) return

    setActionStatus("submitting")
    setActionMessage("Saving voice-over edits...")

    try {
      // Deep-clone the original raw JSON (full structure preserved)
      const patchedRaw = structuredClone(scriptData._raw) as Record<string, unknown>

      // Patch only `text` fields in parts[].timeline[] — everything else untouched
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

      // Write back to the same Script_R2_Key
      await reviewEditContinue(info.jobRecordId, info.lockToken, scriptR2Key, patchedRaw)
      setActionStatus("success")
      setActionMessage("Voice-over saved! Pipeline continuing...")
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Save failed")
    }
  }, [scriptData, scriptR2Key, getCallbackInfo])

  // ── Step Review: Action Handlers ──

  /** After Approve or Save&Continue succeeds, switch to Voice Over tab and start polling */
  const startVoiceOverPolling = useCallback(() => {
    console.log("[v0] Switching to Voice Over tab and starting script polling")
    setActiveTab("voiceover")
    setScriptPolling(true)
    setScriptData(null)
    setScriptError(null)
  }, [])

  const handleApprove = useCallback(async () => {
    const info = getCallbackInfo()
    if (!info) return
    setActionStatus("submitting")
    setActionMessage("Approving and continuing pipeline...")
    try {
      await reviewApprove(info.jobRecordId, info.lockToken)
      setActionStatus("success")
      setActionMessage("Approved! Switching to Voice Over...")
      // Notify parent to update card status
      if (isStepReview && (props as StepReviewProps).onApproved) {
        (props as StepReviewProps).onApproved!()
      }
      // Switch to Voice Over tab and start polling
      startVoiceOverPolling()
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Approve failed")
    }
  }, [getCallbackInfo, startVoiceOverPolling])

  const handleSaveAndContinue = useCallback(async () => {
    const info = getCallbackInfo()
    if (!info || !bible) return
    const { jobRecordId, lockToken, bibleR2Key } = info
    setActionStatus("submitting")
    setActionMessage("Writing changes to R2 and continuing...")
    try {
      // Per backend spec: writeback MUST patch the original raw, not the display view.
      // bible._raw holds the original R2 JSON; we patch character_graph and episode_index.
      const patchedRaw = structuredClone(bible._raw ?? {}) as Record<string, unknown>

      // Patch character_graph: map display characters back to raw format
      patchedRaw.character_graph = bible.characters.map((c) => ({
        name: (c.name ?? "").trim(),
        role: (c.role ?? "").trim(),
        visual_feature: (c.description ?? "").trim(),
        relation_map: (c.relation_map ?? "").trim(),
        intent_tag: (c.intent_tag ?? "").trim(),
      }))

      // Patch meta.story_summary with the edited value
      if (!patchedRaw.meta || typeof patchedRaw.meta !== "object") {
        patchedRaw.meta = {}
      }
      ;(patchedRaw.meta as Record<string, unknown>).story_summary = (bible.story_summary ?? "").trim()

      // Patch episode_index: convert episodes array back to object
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
      await reviewEditContinue(jobRecordId, lockToken, bibleR2Key, patchedRaw)
      setOriginalBible(structuredClone(bible))
      setEditMode(false)
      setActionStatus("success")
      setActionMessage("Changes saved! Switching to Voice Over...")
      // Switch to Voice Over tab and start polling
      startVoiceOverPolling()
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Save & Continue failed")
    }
  }, [getCallbackInfo, bible])

  const handleRedo = useCallback(async () => {
    const info = getCallbackInfo()
    if (!info) return
    // Determine current status for redo routing
    const status = isStepReview ? (props as StepReviewProps).currentStatus || "S3_Bible_Check" : "S3_Bible_Check"
    setActionStatus("submitting")
    setActionMessage("Requesting redo...")
    try {
      await reviewRedo(info.jobRecordId, info.lockToken, status)
      setActionStatus("success")
      setActionMessage("Redo triggered! Pipeline will restart this phase.")
    } catch (err) {
      setActionStatus("error")
      setActionMessage(err instanceof Error ? err.message : "Redo failed")
    }
  }, [getCallbackInfo, isStepReview, props])

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
        console.log(`[v0] Script poll | Status: ${job.Status} | Script_R2_Key: ${job.Script_R2_Key || "null"}`)

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

        // If done, stop polling
        if (["S9_Done", "Error", "Failed"].includes(job.Status)) {
          stopped = true
          setProgressPolling(false)
          return
        }

        // Strategy: if Bible_R2_Key exists, transition to step_review.
        // ReviewRoom auto-detects S5_Script_Check and fetches script separately.
        if (job.Bible_R2_Key) {
          console.log("[v0] TRANSITIONING to step_review! Status:", job.Status, "Bible_R2_Key:", job.Bible_R2_Key)
          stopped = true
          setProgressPolling(false)
          onReviewReady?.({ lockToken: job.Lock_Token || "", bibleR2Key: job.Bible_R2_Key, currentStatus: job.Status })
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
      S1_Ingestion: { label: "Ingesting source files...", pct: 10 },
      S2_Brain: { label: "AI is analyzing content...", pct: 30 },
      S3_Bible: { label: "Bible ready for review", pct: 45 },
      S3_Bible_Check: { label: "Bible ready for review", pct: 45 },
      S4_Script: { label: "Generating scripts...", pct: 50 },
      S5_Script: { label: "Scripts ready for review", pct: 65 },
      S5_Script_Check: { label: "Scripts ready for review", pct: 65 },
      S6_VO: { label: "Generating voice over...", pct: 75 },
      S7_Render: { label: "Rendering video...", pct: 85 },
      S8_Render: { label: "Final rendering in progress...", pct: 90 },
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
                    onClick={() => { const fn = (props as ProgressProps).onDelete; if (fn) fn(); else onClose(); }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Project
                  </button>
                </div>
              </div>
            ) : (
              <>
            {progressPolling && <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-pink)]" />}
            {!progressPolling && <CheckCircle2 className="h-10 w-10 text-emerald-400" />}

            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{info.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Status: {progressStatus}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                Record: {jobRecordId}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/30">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${info.pct}%`,
                    background: "linear-gradient(90deg, var(--brand-pink), var(--brand-purple))",
                  }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-muted-foreground">{info.pct}%</p>
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
                onClick={() => { const fn = (props as ProgressProps).onDelete; if (fn) fn(); else onClose(); }}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Project
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
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/30 px-5">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
              Home
            </button>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{projectTitle || "Step Review"}</span>
            <Badge variant="outline" className="ml-2 border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/10 text-[10px] text-[var(--brand-pink)]">
              Phase 1: Bible Review
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
          {/* LEFT: Preview of characters */}
          <div className="flex w-2/5 flex-col border-r border-border/20 bg-background p-6">
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

          {/* RIGHT: Story Summary + Actions */}
          <div className="flex w-3/5 flex-col">
            {/* Phase tabs */}
            <div className="flex shrink-0 items-center gap-1 border-b border-border/20 px-5 py-3">
              <button
                onClick={() => setActiveTab("bible")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "bible" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Story Bible
              </button>
              <div className="mx-2 h-px w-6 bg-border/30" />
              <button
                onClick={() => { if (scriptData || scriptPolling || scriptError) setActiveTab("voiceover") }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === "voiceover" ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground/70",
                  !scriptData && !scriptPolling && !scriptError && "cursor-not-allowed opacity-50"
                )}
              >
                <Mic className="h-3.5 w-3.5" />
                Voice Over
                {scriptPolling && <Loader2 className="ml-1 h-3 w-3 animate-spin text-[var(--brand-pink)]" />}
              </button>
              <div className="mx-2 h-px w-6 bg-border/30" />
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-50"
              >
                <Film className="h-3.5 w-3.5" />
                Final Preview
              </button>
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              {/* ====== BIBLE TAB ====== */}
              {activeTab === "bible" && (
                <div className="flex flex-col gap-5">
                  {/* Story Summary */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Story Summary</h3>
                      {!editMode && (
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

                  {/* Episodes preview */}
                  {bible.episodes && bible.episodes.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">
                        Episodes ({bible.episodes.length})
                      </h3>
                      <div className="flex flex-col gap-2">
                        {bible.episodes.map((ep, i) => (
                          <div key={i} className="rounded-lg border border-border/20 bg-secondary/10 px-4 py-3">
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                                {ep.key}
                              </span>
                              {ep.setting && (
                                <span className="text-[10px] text-muted-foreground">{ep.setting}</span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed text-foreground/70">{ep.summary}</p>
                            {ep.visual_anchors && ep.visual_anchors.length > 0 && (
                              <div className="mt-2 border-t border-border/10 pt-2">
                                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Visual Anchors</span>
                                <ul className="mt-1 flex flex-col gap-0.5">
                                  {ep.visual_anchors.map((anchor, j) => (
                                    <li key={j} className="text-[10px] leading-relaxed text-foreground/50">{anchor}</li>
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
                      <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-[var(--brand-pink)]/20">
                        <div className="absolute inset-y-0 left-0 w-1/3 animate-[progress-slide_1.8s_ease-in-out_infinite] rounded-full bg-[var(--brand-pink)]" />
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {scriptError && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-10">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                      <p className="text-center text-sm font-semibold text-red-400">Generation Failed</p>
                      <p className="text-center text-xs text-red-400/70">{scriptError}</p>
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

              {/* ====== FINAL PREVIEW TAB (placeholder) ====== */}
              {activeTab === "preview" && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Film className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Final Preview is not yet available.</p>
                </div>
              )}
            </ScrollArea>

            {/* Action Status */}
            {actionStatus !== "idle" && (
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
                  {actionMessage}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="shrink-0 border-t border-border/20 px-5 py-3">
              {/* ---- Bible Tab Actions ---- */}
              {activeTab === "bible" && (
                <>
                  {editMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAndContinue}
                        disabled={actionStatus === "submitting"}
                        className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {actionStatus === "submitting" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Save & Continue
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { const fn = (props as StepReviewProps).onDelete; if (fn) fn(); else onClose(); }}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={actionStatus === "submitting" || actionStatus === "success"}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Redo
                      </button>
                      <button
                        onClick={() => setEditMode(true)}
                        disabled={actionStatus === "submitting" || actionStatus === "success"}
                        className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionStatus === "submitting" || actionStatus === "success"}
                        className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {actionStatus === "submitting" ? (
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
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleVOSaveAndContinue}
                            disabled={actionStatus === "submitting"}
                            className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {actionStatus === "submitting" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Save & Continue
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { const fn = (props as StepReviewProps).onDelete; if (fn) fn(); else onClose(); }}
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={actionStatus === "submitting"}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Redo
                          </button>
                          <button
                            onClick={() => setEditMode(true)}
                            disabled={actionStatus === "submitting"}
                            className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={handleApprove}
                            disabled={actionStatus === "submitting"}
                            className="brand-gradient flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {actionStatus === "submitting" ? (
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
                      onClick={() => { setScriptError(null); setScriptPolling(true); }}
                      className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  ) : null}
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
