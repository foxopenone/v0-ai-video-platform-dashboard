"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Mic, Music, Rocket, CheckCircle2,
  Monitor, Globe2, Eye, Palette, Sparkles, Anchor,
  ChevronDown, Wand2, LayoutGrid, Zap
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AudioDrawer } from "@/components/dashboard/audio-drawer"
import { cn } from "@/lib/utils"
import type { SourceVideoEntry } from "@/components/dashboard/upload-zone"

const DISPATCHER_URL = "/api/job-dispatch"

const PARAMS = [
  {
    key: "platform",
    label: "Platform",
    icon: Monitor,
    options: ["TikTok", "Reels", "YouTube_Shorts", "YouTube_Long"],
  },
  {
    key: "asr_language",
    label: "ASR_Language",
    icon: Globe2,
    options: ["EN", "ZH", "YUE", "KO", "FR", "RU", "HI", "JA", "ES"],
    required: true,
  },
  {
    key: "language",
    label: "VO_Language",
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
  {
    key: "energy_level",
    label: "Energy_Level",
    icon: Zap,
    options: ["Low", "Medium", "High", "Extreme"],
  },
] as const

type ParamKey = (typeof PARAMS)[number]["key"]

const ASR_OPTIONS = new Set(["EN", "ZH", "YUE", "KO", "FR", "RU", "HI", "JA", "ES"])

function normalizeAsrLanguage(value: string): string {
  const raw = String(value || "").trim().toUpperCase()
  if (!raw) return ""
  if (raw === "AUTO") return "EN"
  return ASR_OPTIONS.has(raw) ? raw : ""
}

interface TileProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  options: readonly string[]
  onChange: (value: string) => void
  required?: boolean
}

function ParamTile({ label, value, icon: Icon, options, onChange, required }: TileProps) {
  const [open, setOpen] = useState(false)
  const showRequiredWarning = required && !value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-all",
            value
              ? "border-[var(--brand-pink)]/20 bg-[var(--brand-pink)]/5"
              : showRequiredWarning
                ? "border-red-500/50 bg-red-500/5 hover:border-red-500/70"
                : "border-border/40 bg-secondary/20 hover:border-border/60 hover:bg-secondary/35"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5 shrink-0", value ? "text-[var(--brand-pink)]" : showRequiredWarning ? "text-red-400" : "text-foreground/70")} />
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-medium uppercase tracking-wider text-foreground/90">
              {label}
              {required && <span className="ml-0.5 text-red-400">*</span>}
            </p>
            <p className={cn(
              "truncate text-[11px]",
              value ? "font-medium text-foreground" : showRequiredWarning ? "text-red-400" : "text-muted-foreground/60"
            )}>
              {value || (showRequiredWarning ? "Required" : "Select")}
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
  status: "processing" | "pending_review" | "approved" | "completed" | "posted" | "stopped"
  progress: number
  date: string
  thumbnail: null
  episodes: number
  airtableRecordId?: string
  supabaseUserId?: string
  numericJobId?: number
}

export interface StepReviewData {
  jobRecordId: string
  lockToken: string
  bibleR2Key: string
  currentStatus?: string
  projectTitle: string
  frontendJobId?: string
  workMode?: "Full_Auto" | "Step_Review"
}

interface ConfigFormProps {
  /** All ready source entries collected from UploadZone */
  sourceEntries?: SourceVideoEntry[]
  /** Total file count in upload zone (includes still-uploading) */
  totalFileCount?: number
  /** Clear completed uploads after successful ignition */
  clearUploads?: () => void
  /** Insert a placeholder card in My Projects */
  onProjectInsert?: (project: InsertedProject) => void
  /** Update an existing project card's status/progress */
  onProjectUpdate?: (id: string, updates: Partial<InsertedProject>) => void
  /** Open Step Review when Bible is ready */
  onStepReviewReady?: (data: StepReviewData) => void
}

export function ConfigForm({
  sourceEntries = [],
  totalFileCount = 0,
  clearUploads,
  onProjectInsert,
  onProjectUpdate,
  onStepReviewReady,
}: ConfigFormProps) {
  const router = useRouter()

  const [mode, setMode] = useState<"full_auto" | "step_review">("full_auto")
  const [params, setParams] = useState<Record<ParamKey, string>>({
    platform: "", asr_language: "EN", language: "", pov: "", tone: "", style: "", hook: "", energy_level: "Medium",
  })
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false)
  const [bgmDrawerOpen, setBgmDrawerOpen] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null)
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState<"ElevenLabs" | "Azure" | null>(null)
  const [selectedBgm, setSelectedBgm] = useState<string | null>(null)
  const [selectedBgmName, setSelectedBgmName] = useState<string | null>(null)
  const [bgmVolume, setBgmVolume] = useState<number>(0.45)
  const [targetParts, setTargetParts] = useState<number>(3)

  useEffect(() => {
    try {
      const m = localStorage.getItem("cfg_mode")
      if (m) setMode(JSON.parse(m))
      const p = localStorage.getItem("cfg_params")
      if (p) {
        const parsed = JSON.parse(p) as Record<ParamKey, string>
        // Backward compatibility: old saved value "Auto" maps to a valid option.
        parsed.asr_language = normalizeAsrLanguage(parsed.asr_language) || "EN"
        setParams((prev) => ({ ...prev, ...parsed }))
      }
      const v = localStorage.getItem("cfg_voice")
      if (v) setSelectedVoice(JSON.parse(v))
      const vn = localStorage.getItem("cfg_voiceName")
      if (vn) setSelectedVoiceName(JSON.parse(vn))
      const vp = localStorage.getItem("cfg_voiceProvider")
      if (vp) setSelectedVoiceProvider(JSON.parse(vp))
      const b = localStorage.getItem("cfg_bgm")
      if (b) setSelectedBgm(JSON.parse(b))
      const bn = localStorage.getItem("cfg_bgmName")
      if (bn) setSelectedBgmName(JSON.parse(bn))
      const bv = localStorage.getItem("cfg_bgmVolume")
      if (bv) { const vol = JSON.parse(bv); if (vol >= 0.2 && vol <= 0.7) setBgmVolume(vol) }
      const tp = localStorage.getItem("cfg_targetParts")
      if (tp) { const n = JSON.parse(tp); if (n >= 1 && n <= 10) setTargetParts(n) }
    } catch {}
  }, [])

  const hasMounted = useRef(false)
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    try {
      localStorage.setItem("cfg_mode", JSON.stringify(mode))
      localStorage.setItem("cfg_params", JSON.stringify(params))
      localStorage.setItem("cfg_voice", JSON.stringify(selectedVoice))
      localStorage.setItem("cfg_voiceName", JSON.stringify(selectedVoiceName))
      localStorage.setItem("cfg_voiceProvider", JSON.stringify(selectedVoiceProvider))
      localStorage.setItem("cfg_bgm", JSON.stringify(selectedBgm))
      localStorage.setItem("cfg_bgmName", JSON.stringify(selectedBgmName))
      localStorage.setItem("cfg_bgmVolume", JSON.stringify(bgmVolume))
      localStorage.setItem("cfg_targetParts", JSON.stringify(targetParts))
    } catch {}
  }, [mode, params, selectedVoice, selectedVoiceName, selectedVoiceProvider, selectedBgm, selectedBgmName, bgmVolume, targetParts])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const allUploaded = totalFileCount > 0 && sourceEntries.length === totalFileCount
  const hasFilesUploading = totalFileCount > 0 && sourceEntries.length < totalFileCount

  const resolveParam = (key: ParamKey): string => {
    if (params[key]) return params[key]
    const paramDef = PARAMS.find((p) => p.key === key)
    return paramDef ? paramDef.options[0] : ""
  }

  const handleSubmit = async () => {
    if (!allUploaded) return
    if (sourceEntries.length === 0) {
      setErrorMsg("Video_Files is empty. Please upload at least one video.")
      return
    }

    const normalizedAsrLanguage = normalizeAsrLanguage(params.asr_language)
    if (!normalizedAsrLanguage) {
      setErrorMsg("ASR_Language is required. Please select a language.")
      return
    }

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

    const videoFiles = sourceEntries.map((entry) => ({
      url: entry.url,
      filename: entry.filename,
    }))

    const payload = {
      id: jobId,
      Video_Files: videoFiles,
      Platform: resolveParam("platform"),
      ASR_Language: normalizedAsrLanguage,
      Language: resolveParam("language"),
      POV: resolveParam("pov"),
      Tone: resolveParam("tone"),
      Style_Variant: resolveParam("style"),
      Target_Parts: targetParts,
      Hook_Pattern: resolveParam("hook"),
      Energy_Level: resolveParam("energy_level") || "Medium",
      Voice_Select: selectedVoice || "default_voice",
      Voice_Provider: selectedVoiceProvider || "ElevenLabs",
      BGM_Select: selectedBgm || "default_bgm",
      BGM_Volume: bgmVolume,
      Work_Mode: mode === "full_auto" ? "Full_Auto" : "Step_Review",
    }

    try {
      const res = await fetch(DISPATCHER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      const firstFile = sourceEntries[0]?.filename || ""
      const baseName = firstFile.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim()
      const epCount = sourceEntries.length
      const isValidName = baseName.length > 0 && !/^\d+$/.test(baseName)
      const projectTitle = isValidName
        ? `${baseName}${epCount > 1 ? ` +${epCount - 1} EP` : ""}`
        : `New Project (${epCount} EP)`

      let airtableRecordId = ""
      let numericJobId: number | undefined
      try {
        const resText = await res.text()
        console.log("[v0] Dispatch webhook raw response:", resText)
        const resJson = JSON.parse(resText)
        console.log("[v0] Dispatch webhook parsed JSON:", resJson)

        const possibleRecordFields = [
          "Job_Record_ID", "job_record_id", "Record_ID", "record_id",
          "recordId", "airtable_record_id", "id",
        ]
        for (const key of possibleRecordFields) {
          const val = resJson[key]
          if (val && typeof val === "string" && val.startsWith("rec")) {
            airtableRecordId = val
            console.log(`[v0] Found airtableRecordId in field "${key}": ${val}`)
            break
          }
        }

        if (!airtableRecordId) {
          for (const val of Object.values(resJson)) {
            if (val && typeof val === "string" && val.startsWith("rec")) {
              airtableRecordId = val as string
              console.log(`[v0] Found airtableRecordId in value scan: ${val}`)
              break
            }
            if (val && typeof val === "object" && !Array.isArray(val)) {
              for (const innerVal of Object.values(val as Record<string, unknown>)) {
                if (innerVal && typeof innerVal === "string" && innerVal.startsWith("rec")) {
                  airtableRecordId = innerVal as string
                  console.log(`[v0] Found airtableRecordId in nested value: ${innerVal}`)
                  break
                }
              }
              if (airtableRecordId) break
            }
          }
        }

        const possibleJobIdFields = ["Job_ID", "job_id", "jobId", "JobID"]
        for (const key of possibleJobIdFields) {
          if (resJson[key] && !isNaN(Number(resJson[key]))) {
            numericJobId = Number(resJson[key])
            console.log(`[v0] Found numericJobId in field "${key}": ${numericJobId}`)
            break
          }
        }

        if (!airtableRecordId) {
          console.error("[v0] FAILED to extract airtableRecordId from webhook response. Keys:", Object.keys(resJson))
        }
      } catch (err) {
        console.error("[v0] Failed to parse dispatch response:", err)
      }

      const supabaseUserId = session.user.id

      if (!airtableRecordId) {
        setErrorMsg("[Error] Backend did not return a Job_Record_ID (recXXXX). Cannot track this job. Check console for the raw response.")
        setSubmitting(false)
        return
      }

      const newProject: InsertedProject = {
        id: jobId,
        title: projectTitle,
        status: "processing",
        progress: 0,
        date: new Date().toISOString().slice(0, 10),
        thumbnail: null,
        episodes: sourceEntries.length,
        airtableRecordId,
        supabaseUserId,
        numericJobId,
      }
      onProjectInsert?.(newProject)

      if (airtableRecordId) {
        let failCount = 0
        const MAX_FAILS = 5
        const MAX_POLLS = 120
        let pollCount = 0
        let consecutiveHits = 0

        const stageProgress: Record<string, number> = {
          S1_Ingestion: 10, S2_Brain: 30, S3_Bible_Check: 100,
          S4_Script: 50, S5_Script_Check: 100,
          S6_VO: 60, S7_Render: 80, S8_Render: 90, S9_Done: 100,
        }

        const pollInterval = setInterval(async () => {
          if (typeof document !== "undefined" && document.visibilityState !== "visible") {
            return
          }
          pollCount++
          if (pollCount > MAX_POLLS) {
            clearInterval(pollInterval)
            return
          }
          try {
            const pollRes = await fetch(`/api/job-status?record_id=${encodeURIComponent(airtableRecordId)}`)
            if (!pollRes.ok) throw new Error(`HTTP ${pollRes.status}`)
            const job = await pollRes.json()
            failCount = 0

            console.log(`[v0] Poll #${pollCount} | Status: ${job.Status} | Bible_R2_Key: ${job.Bible_R2_Key || "null"} | Lock_Token: ${job.Lock_Token || "null"}`)

            const progress = stageProgress[job.Status] ?? 50
            onProjectUpdate?.(jobId, { progress })

            const isReviewCheck = ["S3_Bible_Check", "S5_Script_Check"].includes(job.Status)
            const r2Key = job.Bible_R2_Key || job.Script_R2_Key
            if (isReviewCheck && !r2Key) {
              console.error(`[FATAL] Status=${job.Status} but R2 key is null. Job_ID=${job.Job_ID}`)
            }
            if (isReviewCheck && r2Key) {
              consecutiveHits++
              if (consecutiveHits >= 2) {
                clearInterval(pollInterval)
                onProjectUpdate?.(jobId, { status: "pending_review", progress: 100 })
                onStepReviewReady?.({
                  jobRecordId: airtableRecordId,
                  lockToken: job.Lock_Token || "",
                  bibleR2Key: r2Key,
                  currentStatus: job.Status,
                  projectTitle,
                  frontendJobId: jobId,
                  workMode: job.Work_Mode || "Step_Review",
                })
              }
            } else {
              consecutiveHits = 0
            }

            if (["S9_Done", "Error", "Failed"].includes(job.Status)) {
              clearInterval(pollInterval)
              onProjectUpdate?.(jobId, {
                status: job.Status === "S9_Done" ? "completed" : "processing",
                progress: job.Status === "S9_Done" ? 100 : progress,
              })
            }
          } catch {
            failCount++
            if (failCount >= MAX_FAILS) {
              clearInterval(pollInterval)
            }
          }
        }, 20000)
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

      <div className="grid grid-cols-3 gap-2">
        {PARAMS.filter(p => p.key !== "hook" && p.key !== "energy_level").map((p) => (
          <ParamTile
            key={p.key}
            label={p.label}
            value={params[p.key]}
            icon={p.icon}
            options={p.options}
            onChange={(val) => setParams((prev) => ({ ...prev, [p.key]: val }))}
            required={"required" in p && p.required}
          />
        ))}
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-2",
            "border-[var(--brand-pink)]/20 bg-[var(--brand-pink)]/5"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[var(--brand-pink)]" />
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-medium uppercase tracking-wider text-foreground/90">Target Parts</p>
            <input
              type="number"
              min={1}
              value={targetParts}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 1) setTargetParts(v)
                else if (e.target.value === "") setTargetParts(1)
              }}
              className="w-full bg-transparent text-[11px] font-medium text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <select
            value={targetParts <= 10 ? targetParts : ""}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v)) setTargetParts(v)
            }}
            className="shrink-0 cursor-pointer rounded bg-transparent px-1 py-0.5 text-[9px] text-muted-foreground/70 outline-none transition-colors hover:text-foreground [&>option]:bg-[hsl(var(--background))] [&>option]:text-foreground"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        {PARAMS.filter(p => p.key === "hook" || p.key === "energy_level").map((p) => (
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
            <p className="mt-0.5 text-[10px] text-muted-foreground">{selectedVoiceProvider || "Select Voice"}</p>
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

      <div className="flex-1" />

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

      {submitted && (
        <p className="mt-1.5 text-center text-sm font-medium text-emerald-400">
          {"🚀 Mission Accepted"}
        </p>
      )}

      {errorMsg && !submitted && (
        <p className="mt-1.5 text-center text-sm text-red-500">
          {errorMsg}
        </p>
      )}

      <AudioDrawer
        type="voice"
        open={voiceDrawerOpen}
        onOpenChange={setVoiceDrawerOpen}
        selectedId={selectedVoice}
        onSelect={(id, name, provider) => {
          setSelectedVoice(id)
          setSelectedVoiceName(name)
          setSelectedVoiceProvider(provider || "ElevenLabs")
        }}
      />
      <AudioDrawer
        type="bgm"
        open={bgmDrawerOpen}
        onOpenChange={setBgmDrawerOpen}
        selectedId={selectedBgm}
        bgmVolume={bgmVolume}
        onBgmVolumeChange={setBgmVolume}
        onSelect={(id, name, _provider, volume) => {
          setSelectedBgm(id)
          setSelectedBgmName(name)
          if (volume !== undefined) setBgmVolume(volume)
        }}
      />
    </div>
  )
}
