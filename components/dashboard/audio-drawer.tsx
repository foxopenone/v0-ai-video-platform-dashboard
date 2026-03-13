"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import useSWR from "swr"
import {
  Play, Pause, Check, Plus, Mic, Music, Volume2, AlertCircle,
  ChevronRight, FolderOpen, Filter, RefreshCw,
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
  onSelect: (id: string, name: string, provider?: "ElevenLabs" | "Azure") => void
}

/* ── Main AudioDrawer ────────────────────────────────── */

export function AudioDrawer({
  type,
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: AudioDrawerProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isVoice = type === "voice"

  // Voice filters
  const [genderFilter, setGenderFilter] = useState<string>("all")
  const [languageFilter, setLanguageFilter] = useState<string>("all")

  /* ── Load data with SWR caching ─────────────────────── */
  // Voices: cached globally, revalidate every 5 minutes
  const { data: voiceItems = [], error: voiceError, isLoading: voiceLoading, mutate: mutateVoices } = useSWR<VoiceOption[]>(
    isVoice && open ? "/api/voices" : null,
    () => fetchVoices(),
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 min cache
  )
  
  // BGM: cached globally
  const { data: bgmItems = [], error: bgmError, isLoading: bgmLoading, mutate: mutateBgm } = useSWR<BGMItem[]>(
    !isVoice && open ? "bgm-list" : null,
    () => fetchBGM(),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  )
  
  const loading = isVoice ? voiceLoading : bgmLoading
  const error = isVoice ? (voiceError?.message || null) : (bgmError?.message || null)
  
  // Refresh data function
  const handleRefresh = useCallback(() => {
    if (isVoice) {
      mutateVoices()
    } else {
      mutateBgm()
    }
  }, [isVoice, mutateVoices, mutateBgm])
  
  // Expand category of selected BGM
  useEffect(() => {
    if (!isVoice && selectedId && bgmItems.length > 0) {
      const sel = bgmItems.find((d) => d.id === selectedId)
      if (sel) setExpandedCategories(new Set([sel.category]))
    }
  }, [isVoice, selectedId, bgmItems])

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
              ? "Choose a narrator voice for your video"
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
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Refresh voice list"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </button>
          </div>
        )}

        <ScrollArea className={cn("pr-1", isVoice && !loading ? "mt-3" : "mt-6")} style={{ height: "calc(100vh - 16rem)" }}>
          <div className="flex flex-col gap-2 pr-3">
            {/* Loading skeleton - show more items to fill screen */}
            {loading && (
              <div className="space-y-2">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-pink)] border-t-transparent" />
                  <span className="text-xs text-muted-foreground">Loading voices...</span>
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-secondary/50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-secondary/50" />
                      <div className="flex gap-2">
                        <div className="h-3 w-12 animate-pulse rounded bg-secondary/40" />
                        <div className="h-3 w-8 animate-pulse rounded bg-secondary/40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                                  onClick={() => onSelect(v.id, v.name, v.provider)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(v.id, v.name, v.provider) }
                                  }}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-pink-500/40 bg-pink-500/10 ring-1 ring-pink-500/20"
                      : "border-border/20 bg-secondary/15 hover:border-border/40 hover:bg-secondary/30",
                  )}
                >
                  {/* Play / Pause */}
                  <div className="relative group/play">
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
                    {!hasPreview && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover/play:opacity-100">
                        No preview
                      </div>
                    )}
                  </div>

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
                                      {v.provider && (
                                        <span className={cn(
                                          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                          v.provider === "Azure" 
                                            ? "bg-sky-500/15 text-sky-400"
                                            : "bg-violet-500/15 text-violet-400"
                                        )}>
                                          {v.provider}
                                        </span>
                                      )}
                                    </div>
                  </div>

                  {/* Playing indicator */}
                  {isPlaying && (
                    <Volume2 className="h-4 w-4 shrink-0 animate-pulse text-pink-400" />
                  )}

                  {/* + / checkmark toggle */}
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isSelected
                        ? "border-pink-500 bg-pink-500 text-white"
                        : "border-border/40 bg-transparent text-muted-foreground/50 group-hover:border-border/60 group-hover:text-muted-foreground",
                    )}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </div>
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
                      categoryHasSelected && !isExpanded && "border border-violet-500/20 bg-violet-500/5",
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
                        const isTrackSelected = selectedId === t.id
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
                              isTrackSelected
                                ? "border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/20"
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
                            {isPlaying && <Volume2 className="h-3.5 w-3.5 shrink-0 animate-pulse text-violet-400" />}
                            {/* + / checkmark toggle */}
                            <div
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                isTrackSelected
                                  ? "border-violet-500 bg-violet-500 text-white"
                                  : "border-border/40 bg-transparent text-muted-foreground/50 group-hover:border-border/60 group-hover:text-muted-foreground",
                              )}
                            >
                              {isTrackSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            </div>
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

        {/* Confirm button -- always visible at bottom */}
        <div className="mt-3 flex items-center gap-3 border-t border-border/20 pt-3">
          {selectedId && (
            <p className="flex-1 truncate text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">
                {isVoice
                  ? voiceItems.find((v) => v.id === selectedId)?.name
                  : bgmItems.find((b) => b.id === selectedId)?.name
                  || "..."}
              </span>
            </p>
          )}
          {!selectedId && <p className="flex-1 text-xs text-muted-foreground">No selection</p>}
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "shrink-0 rounded-lg px-5 py-2 text-xs font-semibold transition-all",
              selectedId
                ? "brand-gradient text-[#fff] hover:opacity-90"
                : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {selectedId ? "Confirm" : "Close"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
