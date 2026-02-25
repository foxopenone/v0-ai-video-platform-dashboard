"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Mic, Music, Rocket, CheckCircle2,
  Monitor, Globe2, Eye, Palette, Sparkles, Anchor,
  ChevronDown, Wand2
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AudioDrawer } from "@/components/dashboard/audio-drawer"
import { cn } from "@/lib/utils"
import type { R2FileEntry } from "@/components/dashboard/upload-zone"

const DISPATCHER_URL = "https://n8n-production-8abb.up.railway.app/webhook/job-ingestion-final"
const API_KEY = "7043cdf229ea2c813b1ec646264cda891c047a69"
const R2_BUCKET_URL = "https://video.aihers.live"

const PARAMS = [
  {
    key: "platform",
    label: "Platform",
    icon: Monitor,
    options: ["TikTok", "Reels", "YouTube_Shorts", "YouTube_Long"],
  },
  {
    key: "language",
    label: "Language",
    icon: Globe2,
    options: ["English", "Spanish", "Chinese", "Korean", "Arabic", "Portuguese", "Hindi", "Indonesian"],
  },
  {
    key: "pov",
    label: "POV",
    icon: Eye,
    options: ["God_View", "Female_Lead", "Male_Lead"],
  },
  {
    key: "tone",
    label: "Tone",
    icon: Palette,
    options: ["Roast", "Suspense", "Hype", "Emotional", "Recap", "Gossip"],
  },
  {
    key: "style",
    label: "Style",
    icon: Sparkles,
    options: ["Meme", "Deep_Dive", "Fast_Paced", "Villain_Vibe", "Romance"],
  },
  {
    key: "hook",
    label: "Hook",
    icon: Anchor,
    options: ["POV_Shock", "Question", "Roast", "Suspense", "Emotional"],
  },
] as const

type ParamKey = (typeof PARAMS)[number]["key"]

interface TileProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  options: readonly string[]
  onChange: (value: string) => void
}

function ParamTile({ label, value, icon: Icon, options, onChange }: TileProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-all",
            value
              ? "border-[var(--brand-pink)]/20 bg-[var(--brand-pink)]/5"
              : "border-border/40 bg-secondary/20 hover:border-border/60 hover:bg-secondary/35"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5 shrink-0", value ? "text-[var(--brand-pink)]" : "text-foreground/70")} />
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-medium uppercase tracking-wider text-foreground/90">{label}</p>
            <p className={cn(
              "truncate text-[11px]",
              value ? "font-medium text-foreground" : "text-muted-foreground/60"
            )}>
              {value || "Select"}
            </p>
          </div>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setOpen(false) }}
            className={cn(
              "flex w-full items-center rounded-md px-2.5 py-1.5 text-xs transition-colors",
              value === opt
                ? "bg-[var(--brand-pink)]/10 font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export interface InsertedProject {
  id: string
  title: string
  status: "processing"
  progress: number
  date: string
  thumbnail: null
  episodes: number
}

export interface StepReviewData {
  jobRecordId: string
  lockToken: string
  bibleR2Key: string
  projectTitle: string
}

interface ConfigFormProps {
  /** All r2 file entries collected from UploadZone pre-uploads */
  r2Entries?: R2FileEntry[]
  /** Total file count in upload zone (includes still-uploading) */
  totalFileCount?: number
  /** Clear completed uploads after successful ignition */
  clearUploads?: () => void
  /** Insert a placeholder card in My Projects */
  onProjectInsert?: (project: InsertedProject) => void
  /** Open Step Review when Bible is ready */
  onStepReviewReady?: (data: StepReviewData) => void
}

export function ConfigForm({
  r2Entries = [],
  totalFileCount = 0,
  clearUploads,
  onProjectInsert,
  onStepReviewReady,
}: ConfigFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"full_auto" | "step_review">("full_auto")
  const [params, setParams] = useState<Record<ParamKey, string>>({
    platform: "",
    language: "",
    pov: "",
    tone: "",
    style: "",
    hook: "",
  })
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false)
  const [bgmDrawerOpen, setBgmDrawerOpen] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null)
  const [selectedBgm, setSelectedBgm] = useState<string | null>(null)
  const [selectedBgmName, setSelectedBgmName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // All files must have r2_key before ignition is allowed
  const allUploaded = totalFileCount > 0 && r2Entries.length === totalFileCount
  const hasFilesUploading = totalFileCount > 0 && r2Entries.length < totalFileCount

  // Resolve param value: user selection or first option in list (default)
  const resolveParam = (key: ParamKey): string => {
    if (params[key]) return params[key]
    const paramDef = PARAMS.find((p) => p.key === key)
    return paramDef ? paramDef.options[0] : ""
  }

  const handleSubmit = async () => {
    if (!allUploaded) return
    if (r2Entries.length === 0) {
      setErrorMsg("Video_Files is empty. Please upload at least one video.")
      return
    }

    // Auth gate: must be logged in to dispatch
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login")
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setSubmitted(false)

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const videoFiles = r2Entries.map((entry) => ({
      url: `${R2_BUCKET_URL}/${entry.r2Key}`,
      filename: entry.filename,
    }))

    // Build callback URL for n8n to POST when Bible is ready
    const origin = typeof window !== "undefined" ? window.location.origin : ""

    const payload = {
      id: jobId,
      Video_Files: videoFiles,
      Platform: resolveParam("platform"),
      Language: resolveParam("language"),
      POV: resolveParam("pov"),
      Tone: resolveParam("tone"),
      Style_Variant: resolveParam("style"),
      Hook_Pattern: resolveParam("hook"),
      Voice_Select: selectedVoice || "default_voice",
      BGM_Select: selectedBgm || "default_bgm",
      Work_Mode: mode === "full_auto" ? "Full_Auto" : "Step_Review",
      ...(mode === "step_review" && {
        callback_url: `${origin}/api/bible-ready`,
      }),
    }

    try {
      const res = await fetch(DISPATCHER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_KEY,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        if (res.status === 403) {
          setErrorMsg("[Auth Error] X-API-KEY 校验失败，请联系管理员。")
        } else if (res.status === 500) {
          let detail = ""
          try {
            const json = await res.json()
            detail = json.message || json.error || JSON.stringify(json)
          } catch {
            detail = await res.text().catch(() => res.statusText)
          }
          setErrorMsg(`[Backend Error] 后端逻辑执行失败：${detail}`)
        } else {
          const body = await res.text().catch(() => "")
          setErrorMsg(`[Error ${res.status}] ${body || res.statusText}`)
        }
        setSubmitting(false)
        return
      }

      setSubmitted(true)
      clearUploads?.()

      const projectTitle = `New Project (${r2Entries.length} EP)`

      // Parse dispatch response to get backend Job_ID (Airtable ID)
      let backendJobId = jobId
      try {
        const resJson = await res.json()
        console.log("[v0] Dispatch response:", resJson)
        // n8n may return Job_ID or id or the Airtable record ID
        if (resJson.Job_ID !== undefined) {
          backendJobId = String(resJson.Job_ID)
        } else if (resJson.id !== undefined) {
          backendJobId = String(resJson.id)
        }
      } catch {
        console.log("[v0] Dispatch response not JSON, using frontend jobId for polling")
      }
      console.log("[v0] Using poll key:", backendJobId)

      onProjectInsert?.({
        id: jobId,
        title: projectTitle,
        status: "processing",
        progress: 0,
        date: new Date().toISOString().slice(0, 10),
        thumbnail: null,
        episodes: r2Entries.length,
      })

      // If Step_Review mode, start polling /api/bible-ready for n8n callback
      if (mode === "step_review") {
        console.log("[v0] Step Review: Starting poll for job:", backendJobId)
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/bible-ready?job_id=${encodeURIComponent(backendJobId)}`)
            const pollData = await pollRes.json()
            console.log("[v0] Poll result:", pollData)
            if (pollData.ready) {
              clearInterval(pollInterval)
              onStepReviewReady?.({
                jobRecordId: pollData.Job_Record_ID,
                lockToken: pollData.Lock_Token || "",
                bibleR2Key: pollData.Bible_R2_Key,
                projectTitle,
              })
            }
          } catch (err) {
            console.warn("[v0] Poll error:", err)
          }
        }, 5000) // Poll every 5 seconds

        // Stop polling after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000)
      }

      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setErrorMsg(`[Network Error] 请检查网络连接或后端 CORS 配置。(${msg})`)
      setSubmitting(false)
      return
    }
    setSubmitting(false)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Mode Toggle - Premium segmented control */}
      <div className="flex rounded-lg border border-border/40 bg-secondary/20 p-0.5">
        <button
          onClick={() => setMode("full_auto")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            mode === "full_auto"
              ? "brand-gradient text-[#fff] shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wand2 className="h-3 w-3" />
          Full Auto
        </button>
        <button
          onClick={() => setMode("step_review")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            mode === "step_review"
              ? "brand-gradient text-[#fff] shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="h-3 w-3" />
          Step Review
        </button>
      </div>

      {/* Parameter tiles grid - compact, converged */}
      <div className="grid grid-cols-3 gap-2">
        {PARAMS.map((p) => (
          <ParamTile
            key={p.key}
            label={p.label}
            value={params[p.key]}
            icon={p.icon}
            options={p.options}
            onChange={(val) => setParams((prev) => ({ ...prev, [p.key]: val }))}
          />
        ))}
      </div>

      {/* Audio Slots - expanded cards with waveform hint */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setVoiceDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border px-4 py-5 transition-all",
            selectedVoice
              ? "border-[var(--brand-pink)]/25 bg-[var(--brand-pink)]/5"
              : "border-border/40 bg-secondary/15 hover:border-border/60 hover:bg-secondary/30"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
            <Mic className="h-4.5 w-4.5 text-[var(--brand-pink)]" />
          </div>
          {/* Mini waveform decoration */}
          <div className="flex items-end gap-[2px]">
            {[3, 5, 8, 12, 8, 10, 6, 4, 7, 11, 6, 3].map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-[2px] rounded-full",
                  selectedVoice ? "bg-[var(--brand-pink)]/40" : "bg-muted-foreground/15"
                )}
                style={{ height: h }}
              />
            ))}
          </div>
          <div className="w-full overflow-hidden text-center">
            <p className="truncate text-xs font-medium text-foreground">
              {selectedVoiceName || "Add Voice"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Eleven Labs AI</p>
          </div>
        </button>

        <button
          onClick={() => setBgmDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border px-4 py-5 transition-all",
            selectedBgm
              ? "border-[var(--brand-purple)]/25 bg-[var(--brand-purple)]/5"
              : "border-border/40 bg-secondary/15 hover:border-border/60 hover:bg-secondary/30"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50">
            <Music className="h-4.5 w-4.5 text-[var(--brand-purple)]" />
          </div>
          {/* Mini waveform decoration */}
          <div className="flex items-end gap-[2px]">
            {[4, 7, 5, 10, 13, 8, 6, 11, 5, 9, 4, 6].map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-[2px] rounded-full",
                  selectedBgm ? "bg-[var(--brand-purple)]/40" : "bg-muted-foreground/15"
                )}
                style={{ height: h }}
              />
            ))}
          </div>
          <div className="w-full overflow-hidden text-center">
            <p className="truncate text-xs font-medium text-foreground">
              {selectedBgmName || "Add BGM"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Background Music</p>
          </div>
        </button>
      </div>

      {/* Spacer fills remaining vertical space, pinning button to bottom */}
      <div className="flex-1" />

      {/* Launch button -- disabled until all uploads have r2_key */}
      <button
        onClick={handleSubmit}
        disabled={submitting || submitted || !allUploaded}
        className={cn(
          "relative flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50",
          submitted
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "brand-gradient brand-glow text-[#fff] hover:brightness-110",
          submitting && "animate-pulse"
        )}
      >
        {submitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fff]/30 border-t-[#fff]" />
        ) : submitted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {submitting
          ? "Dispatching..."
          : submitted
            ? "Mission Accepted"
            : hasFilesUploading
              ? "Waiting for uploads..."
              : totalFileCount === 0
                ? "Upload videos first"
                : "Start Generation"}
      </button>

      {/* Success message */}
      {submitted && (
        <p className="mt-1.5 text-center text-sm font-medium text-emerald-400">
          {"\uD83D\uDE80 Mission Accepted"}
        </p>
      )}

      {/* Error message -- allows retry, no redirect, no page reset */}
      {errorMsg && !submitted && (
        <p className="mt-1.5 text-center text-sm text-red-500">
          {errorMsg}
        </p>
      )}

      {/* Audio Drawers */}
      <AudioDrawer
        type="voice"
        open={voiceDrawerOpen}
        onOpenChange={setVoiceDrawerOpen}
        selectedId={selectedVoice}
        onSelect={(id, name) => {
          setSelectedVoice(id)
          setSelectedVoiceName(name)
          setVoiceDrawerOpen(false)
        }}
      />
      <AudioDrawer
        type="bgm"
        open={bgmDrawerOpen}
        onOpenChange={setBgmDrawerOpen}
        selectedId={selectedBgm}
        onSelect={(id, name) => {
          setSelectedBgm(id)
          setSelectedBgmName(name)
          setBgmDrawerOpen(false)
        }}
      />


    </div>
  )
}
