"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play, Pause, Check, Mic, Music, Volume2, AlertCircle,
  ChevronRight, FolderOpen, Filter,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchVoices, fetchBGM } from "@/lib/mock-api"
import type { VoiceOption } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

/* ── BGM type ────────────────────────────────────────── */

interface BGMItem {
  id: string
  name: string
  category: string
  preview: string
}

interface AudioDrawerProps {
  type: "voice" | "bgm"
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onSelect: (id: string, name: string) => void
}

/* ── Main AudioDrawer ────────────────────────────────── */

export function AudioDrawer({
  type,
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: AudioDrawerProps) {
  const [voiceItems, setVoiceItems] = useState<VoiceOption[]>([])
  const [bgmItems, setBgmItems] = useState<BGMItem[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isVoice = type === "voice"

  // Voice filters
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [languageFilter, setLanguageFilter] = useState<string>("all")

  /* ── Load data ─────────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)

    if (isVoice) {
      fetchVoices()
        .then((data) => { setVoiceItems(data); setLoading(false) })
        .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load voices"); setLoading(false) })
    } else {
      fetchBGM()
        .then((data) => {
          setBgmItems(data)
          if (selectedId) {
            const sel = data.find((d) => d.id === selectedId)
            if (sel) setExpandedCategories(new Set([sel.category]))
          }
          setLoading(false)
        })
        .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load BGM"); setLoading(false) })
    }
  }, [open, isVoice]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Clean up audio on close ───────────────────────── */
  useEffect(() => {
    if (!open) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null }
      setPlayingId(null)
    }
  }, [open])

  /* ── Derive unique genders / languages for filters ─── */
  const genderOptions = useMemo(() => {
    const set = new Set(voiceItems.map((v) => v.gender).filter(Boolean))
    return Array.from(set).sort()
  }, [voiceItems])

  const languageOptions = useMemo(() => {
    const set = new Set(voiceItems.map((v) => v.language).filter(Boolean))
    return Array.from(set).sort()
  }, [voiceItems])

  /* ── Filtered voice list ───────────────────────────── */
  const filteredVoices = useMemo(() => {
    return voiceItems.filter((v) => {
      if (genderFilter !== "all" && v.gender !== genderFilter) return false
      if (languageFilter !== "all" && v.language !== languageFilter) return false
      return true
    })
  }, [voiceItems, genderFilter, languageFilter])

  /* ── Group BGM items by category ────────────────────── */
  const bgmByCategory = useMemo(() => {
    const map = new Map<string, BGMItem[]>()
    for (const item of bgmItems) {
      const cat = item.category || "Other"
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [bgmItems])

  /* ── Toggle category folder ─────────────────────────── */
  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }, [])

  /* ── Play / pause real audio ────────────────────────── */
  const handlePlay = useCallback((id: string, previewUrl: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (!previewUrl || previewUrl === "#") return

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = "" }

    const audio = new Audio(previewUrl)
    audio.crossOrigin = "anonymous"
    audioRef.current = audio
    audio.addEventListener("ended", () => setPlayingId(null))
    audio.addEventListener("error", () => setPlayingId(null))
    audio.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null))
  }, [playingId])

  /* ── Gender display label ──────────────────────────── */
  const genderLabel = (g: string) => {
    if (g === "female") return "Female"
    if (g === "male") return "Male"
    if (g === "neutral") return "Neutral"
    return g
  }

  const langLabel = (l: string) => l.toUpperCase()

  /* ── Render ─────────────────────────────────────────── */
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border/30 bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            {isVoice ? (
              <Mic className="h-4 w-4 text-[var(--brand-pink)]" />
            ) : (
              <Music className="h-4 w-4 text-[var(--brand-purple)]" />
            )}
            {isVoice ? "Select Voice" : "Select Background Music"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {isVoice
              ? "Choose a narrator voice powered by ElevenLabs"
              : "Browse categories and preview tracks"}
          </SheetDescription>
        </SheetHeader>

        {/* ════ Voice Filters ════ */}
        {isVoice && !loading && voiceItems.length > 0 && (
          <div className="mt-4 flex items-center gap-2 px-1">
            <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-8 rounded-md border border-border/30 bg-secondary/20 px-2 text-xs text-foreground outline-none focus:border-[var(--brand-pink)]/50"
            >
              <option value="all">All Genders</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>{genderLabel(g)}</option>
              ))}
            </select>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-8 rounded-md border border-border/30 bg-secondary/20 px-2 text-xs text-foreground outline-none focus:border-[var(--brand-pink)]/50"
            >
              <option value="all">All Languages</option>
              {languageOptions.map((l) => (
                <option key={l} value={l}>{langLabel(l)}</option>
              ))}
            </select>
            {(genderFilter !== "all" || languageFilter !== "all") && (
              <button
                onClick={() => { setGenderFilter("all"); setLanguageFilter("all") }}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <ScrollArea className={cn("h-[calc(100vh-12rem)] pr-1", isVoice && !loading ? "mt-3" : "mt-6")}>
          <div className="flex flex-col gap-2 pr-3">
            {/* Loading */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary/40" />
            ))}

            {/* Error */}
            {error && !loading && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-center text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Empty (no data at all) */}
            {!loading && !error && (isVoice ? voiceItems : bgmItems).length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                {isVoice
                  ? <Mic className="h-6 w-6 text-muted-foreground/30" />
                  : <Music className="h-6 w-6 text-muted-foreground/30" />}
                <p className="text-sm text-muted-foreground">
                  {isVoice ? "No voices available" : "No BGM tracks available"}
                </p>
              </div>
            )}

            {/* Empty after filter */}
            {!loading && isVoice && voiceItems.length > 0 && filteredVoices.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Filter className="h-5 w-5 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No voices match filters</p>
              </div>
            )}

            {/* ════ Voice list with cards ════ */}
            {!loading && isVoice && filteredVoices.map((v) => {
              const isSelected = selectedId === v.id
              const isPlaying = playingId === v.id
              const hasPreview = !!v.preview && v.preview !== "#"

              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(v.id, v.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(v.id, v.name) }
                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/5"
                      : "border-border/20 bg-secondary/15 hover:border-border/40 hover:bg-secondary/30",
                  )}
                >
                  {/* Play / Pause */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(v.id, v.preview) }}
                    disabled={!hasPreview}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                      isPlaying
                        ? "brand-gradient text-[#fff]"
                        : hasPreview
                          ? "bg-secondary/60 text-muted-foreground hover:text-foreground"
                          : "cursor-not-allowed bg-secondary/30 text-muted-foreground/30",
                    )}
                    aria-label={isPlaying ? "Pause preview" : hasPreview ? "Play preview" : "No preview"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                  </button>

                  {/* Name + tags */}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">{v.name}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {v.gender && (
                        <span className={cn(
                          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                          v.gender === "female" ? "bg-pink-500/15 text-pink-400"
                            : v.gender === "male" ? "bg-blue-500/15 text-blue-400"
                            : "bg-emerald-500/15 text-emerald-400",
                        )}>
                          {genderLabel(v.gender)}
                        </span>
                      )}
                      {v.language && (
                        <span className="inline-flex rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                          {langLabel(v.language)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Playing indicator */}
                  {isPlaying && (
                    <Volume2 className="h-4 w-4 shrink-0 animate-pulse text-[var(--brand-pink)]" />
                  )}

                  {/* Selected check */}
                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full brand-gradient">
                      <Check className="h-3 w-3 text-[#fff]" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* ════ BGM category folders ════ */}
            {!loading && !isVoice && bgmByCategory.map(([category, tracks]) => {
              const isExpanded = expandedCategories.has(category)
              const categoryHasSelected = tracks.some((t) => t.id === selectedId)
              const trackCount = tracks.length

              return (
                <div key={category} className="flex flex-col">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all",
                      isExpanded
                        ? "bg-secondary/30"
                        : "hover:bg-secondary/20",
                      categoryHasSelected && !isExpanded && "border border-[var(--brand-purple)]/20 bg-[var(--brand-purple)]/5",
                    )}
                  >
                    <FolderOpen
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isExpanded ? "text-[var(--brand-purple)]" : "text-muted-foreground",
                      )}
                    />
                    <span className="flex-1 text-sm font-semibold text-foreground">{category}</span>
                    <span className="mr-1 text-[10px] tabular-nums text-muted-foreground">
                      {trackCount} track{trackCount !== 1 ? "s" : ""}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </button>

                  {/* Tracks inside folder */}
                  {isExpanded && (
                    <div className="ml-2 flex flex-col gap-1.5 border-l border-border/15 pl-3 pt-1.5 pb-1">
                      {tracks.map((t) => {
                        const isSelected = selectedId === t.id
                        const isPlaying = playingId === t.id
                        const hasPreview = !!t.preview && t.preview !== "#"

                        return (
                          <div
                            key={t.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect(t.id, t.name)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(t.id, t.name) }
                            }}
                            className={cn(
                              "group flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-left transition-all",
                              isSelected
                                ? "border-[var(--brand-purple)]/30 bg-[var(--brand-purple)]/5"
                                : "border-border/20 bg-secondary/15 hover:border-border/40 hover:bg-secondary/30",
                            )}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePlay(t.id, t.preview) }}
                              disabled={!hasPreview}
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
                                isPlaying
                                  ? "brand-gradient text-[#fff]"
                                  : hasPreview
                                    ? "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                    : "cursor-not-allowed bg-secondary/30 text-muted-foreground/30",
                              )}
                              aria-label={isPlaying ? "Pause" : "Play"}
                            >
                              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="ml-0.5 h-3 w-3" />}
                            </button>
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate text-xs font-medium text-foreground">{t.name}</p>
                              <p className="text-[10px] text-muted-foreground">{category}</p>
                            </div>
                            {isPlaying && <Volume2 className="h-3.5 w-3.5 shrink-0 animate-pulse text-[var(--brand-purple)]" />}
                            {isSelected && (
                              <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full brand-gradient">
                                <Check className="h-2.5 w-2.5 text-[#fff]" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
