"use client"

import { useState } from "react"
import { Mic, Music, Rocket, Settings2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AudioDrawer } from "@/components/dashboard/audio-drawer"
import { submitProject } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

const PLATFORMS = ["TikTok", "YouTube Shorts", "Instagram Reels", "Twitter/X", "LinkedIn"]
const LANGUAGES = ["English", "Spanish", "Chinese", "Korean", "Arabic", "Portuguese", "Hindi", "Indonesian"]
const POVS = ["First Person", "Second Person", "Third Person", "Neutral"]
const TONES = ["Professional", "Casual", "Humorous", "Inspirational", "Educational", "Dramatic"]
const STYLES = ["Documentary", "Vlog", "News", "Cinematic", "Minimal", "Storytelling"]
const HOOKS = ["Question", "Bold Statement", "Statistic", "Controversy", "Story Opener", "Challenge"]

interface SelectFieldProps {
  label: string
  placeholder: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

function SelectField({ label, placeholder, options, value, onChange }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-border/30 bg-secondary/30 text-sm text-foreground hover:bg-secondary/50 focus:ring-primary/30">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt.toLowerCase().replace(/[/ ]/g, "-")}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ConfigForm() {
  const [mode, setMode] = useState<"full_auto" | "step_review">("full_auto")
  const [platform, setPlatform] = useState("")
  const [language, setLanguage] = useState("")
  const [pov, setPov] = useState("")
  const [tone, setTone] = useState("")
  const [style, setStyle] = useState("")
  const [hook, setHook] = useState("")
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false)
  const [bgmDrawerOpen, setBgmDrawerOpen] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedBgm, setSelectedBgm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    await submitProject({
      mode,
      platform,
      language,
      pov,
      tone,
      style,
      hook,
      voice: selectedVoice,
      bgm: selectedBgm,
    })
    setSubmitting(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="h-4 w-4 text-primary" />
          Configuration
        </h3>
      </div>

      {/* Work Mode Toggle */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Work Mode</p>
          <p className="text-xs text-muted-foreground">
            {mode === "full_auto" ? "Fully automated pipeline" : "Review each step"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              mode === "full_auto" ? "text-primary" : "text-muted-foreground"
            )}
          >
            Auto
          </span>
          <Switch
            checked={mode === "step_review"}
            onCheckedChange={(checked) =>
              setMode(checked ? "step_review" : "full_auto")
            }
          />
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              mode === "step_review" ? "text-primary" : "text-muted-foreground"
            )}
          >
            Review
          </span>
        </div>
      </div>

      {/* Dropdowns Grid */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <SelectField
          label="Platform"
          placeholder="Select platform"
          options={PLATFORMS}
          value={platform}
          onChange={setPlatform}
        />
        <SelectField
          label="Language"
          placeholder="Select language"
          options={LANGUAGES}
          value={language}
          onChange={setLanguage}
        />
        <SelectField
          label="POV"
          placeholder="Select POV"
          options={POVS}
          value={pov}
          onChange={setPov}
        />
        <SelectField
          label="Tone"
          placeholder="Select tone"
          options={TONES}
          value={tone}
          onChange={setTone}
        />
        <SelectField
          label="Style"
          placeholder="Select style"
          options={STYLES}
          value={style}
          onChange={setStyle}
        />
        <SelectField
          label="Hook"
          placeholder="Select hook"
          options={HOOKS}
          value={hook}
          onChange={setHook}
        />
      </div>

      {/* Audio Selectors */}
      <div className="mb-5 flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">Audio</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setVoiceDrawerOpen(true)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-3 transition-all",
              selectedVoice
                ? "border-primary/50 bg-primary/5"
                : "border-border/30 bg-secondary/20 hover:border-border/50 hover:bg-secondary/40"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Mic className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">
                {selectedVoice ? "Voice Selected" : "Select Voice"}
              </p>
              <p className="text-[10px] text-muted-foreground">Eleven Labs</p>
            </div>
          </button>

          <button
            onClick={() => setBgmDrawerOpen(true)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border p-3 transition-all",
              selectedBgm
                ? "border-primary/50 bg-primary/5"
                : "border-border/30 bg-secondary/20 hover:border-border/50 hover:bg-secondary/40"
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
              <Music className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">
                {selectedBgm ? "BGM Selected" : "Select BGM"}
              </p>
              <p className="text-[10px] text-muted-foreground">Background Music</p>
            </div>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-auto w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        {submitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {submitting ? "Launching..." : "Launch Pipeline"}
      </Button>

      {/* Audio Drawers */}
      <AudioDrawer
        type="voice"
        open={voiceDrawerOpen}
        onOpenChange={setVoiceDrawerOpen}
        selectedId={selectedVoice}
        onSelect={(id) => {
          setSelectedVoice(id)
          setVoiceDrawerOpen(false)
        }}
      />
      <AudioDrawer
        type="bgm"
        open={bgmDrawerOpen}
        onOpenChange={setBgmDrawerOpen}
        selectedId={selectedBgm}
        onSelect={(id) => {
          setSelectedBgm(id)
          setBgmDrawerOpen(false)
        }}
      />
    </div>
  )
}
