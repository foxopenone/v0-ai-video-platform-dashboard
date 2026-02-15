"use client"

import { useState } from "react"
import {
  Mic, Music, Rocket,
  Monitor, Globe2, Eye, Palette, Sparkles, Anchor,
  ChevronDown, Wand2
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AudioDrawer } from "@/components/dashboard/audio-drawer"
import { ReviewModal } from "@/components/dashboard/review-modal"
import { submitProject } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

const PARAMS = [
  {
    key: "platform",
    label: "Platform",
    icon: Monitor,
    options: ["TikTok", "YouTube Shorts", "Instagram Reels", "Twitter/X", "LinkedIn"],
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
    options: ["First Person", "Second Person", "Third Person", "Neutral"],
  },
  {
    key: "tone",
    label: "Tone",
    icon: Palette,
    options: ["Professional", "Casual", "Humorous", "Inspirational", "Educational", "Dramatic"],
  },
  {
    key: "style",
    label: "Style",
    icon: Sparkles,
    options: ["Documentary", "Vlog", "News", "Cinematic", "Minimal", "Storytelling"],
  },
  {
    key: "hook",
    label: "Hook",
    icon: Anchor,
    options: ["Question", "Bold Statement", "Statistic", "Controversy", "Story Opener", "Challenge"],
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
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="truncate text-[11px] font-medium text-foreground">
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

export function ConfigForm() {
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
  const [reviewOpen, setReviewOpen] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await submitProject({
      mode,
      ...params,
      voice: selectedVoice,
      bgm: selectedBgm,
    })
    setSubmitting(false)
    // If Step Review mode, open review modal after submission
    if (mode === "step_review") {
      setReviewOpen(true)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
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

      {/* Audio Slots */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setVoiceDrawerOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2.5 transition-all",
            selectedVoice
              ? "border-[var(--brand-pink)]/25 bg-[var(--brand-pink)]/5"
              : "border-border/40 bg-secondary/20 hover:border-border/60 hover:bg-secondary/35"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary/60">
            <Mic className="h-3.5 w-3.5 text-[var(--brand-pink)]" />
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate text-[11px] font-medium text-foreground">
              {selectedVoiceName || "Add Voice"}
            </p>
            <p className="text-[9px] text-muted-foreground">Eleven Labs</p>
          </div>
        </button>

        <button
          onClick={() => setBgmDrawerOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2.5 transition-all",
            selectedBgm
              ? "border-[var(--brand-purple)]/25 bg-[var(--brand-purple)]/5"
              : "border-border/40 bg-secondary/20 hover:border-border/60 hover:bg-secondary/35"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary/60">
            <Music className="h-3.5 w-3.5 text-[var(--brand-purple)]" />
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate text-[11px] font-medium text-foreground">
              {selectedBgmName || "Add BGM"}
            </p>
            <p className="text-[9px] text-muted-foreground">Background</p>
          </div>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Launch button with neon glow */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={cn(
          "brand-gradient brand-glow flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-[#fff] transition-all hover:opacity-90 disabled:opacity-50",
          submitting && "animate-pulse"
        )}
      >
        {submitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fff]/30 border-t-[#fff]" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {submitting ? "Generating..." : "Start Generation"}
      </button>

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

      {/* Step Review Modal */}
      <ReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        projectTitle="New Project"
      />
    </div>
  )
}
