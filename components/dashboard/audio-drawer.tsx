"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play, Pause, Check, Mic, Music, Volume2, AlertCircle,
  ChevronRight, FolderOpen,
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
import { cn } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────── */

interface VoiceItem {
  id: string
  name: string
  preview: string
}

interface BGMItem {
  id: string       // r2_key -- this is the value stored as BGM_Select
  name: string     // track_name
  category: string // folder label
  preview: string  // playback URL
}

interface AudioDrawerProps {
  type: "voice" | "bgm"
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onSelect: (id: string, name: string) => void
}

/* ── Reusable track row ─────────────────────────────── */

function TrackRow({
  id,
  name,
  preview,
  isSelected,
  isPlaying,
  brandColor,
  onPlay,
  onSelect,
  subtitle,
}: {
  id: string
  name: string
  preview: string
  isSelected: boolean
  isPlaying: boolean
  brandColor: string
  onPlay: () => void
  onSelect: () => void
  subtitle: string
}) {
  const hasPreview = !!preview && preview !== "#"
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect() }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
        isSelected
          ? `border-[${brandColor}]/30 bg-[${brandColor}]/5`
          : "border-border/20 bg-secondary/15 hover:border-border/40 hover:bg-secondary/30",
      )}
    >
      {/* Play / Pause */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlay() }}
        disabled={!hasPreview}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
          isPlaying
            ? "brand-gradient text-[#fff]"
            : hasPreview
              ? "bg-secondary/60 text-muted-foreground hover:text-foreground"
              : "cursor-not-allowed bg-secondary/30 text-muted-foreground/30",
        )}
        aria-label={isPlaying ? "Pause preview" : hasPreview ? "Play preview" : "No preview"}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
      </button>

      {/* Name + subtitle */}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <Volume2 className="h-4 w-4 shrink-0 animate-pulse" style={{ color: brandColor }} />
      )}

      {/* Selected check */}
      {isSelected && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full brand-gradient">
          <Check className="h-3 w-3 text-[#fff]" />
        </div>
      )}
    </div>
  )
}

/* ── Main AudioDrawer ────────────────────────────────── */

export function AudioDrawer({
  type,
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: AudioDrawerProps) {
  const [voiceItems, setVoiceItems] = useState<VoiceItem[]>([])
  const [bgmItems, setBgmItems] = useState<BGMItem[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isVoice = type === "voice"

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
          // Auto-expand the category of the currently selected track (if any)
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

  /* ── Group BGM items by category ────────────────────── */
  const bgmByCategory = useMemo(() => {
    const map = new Map<string, BGMItem[]>()
    for (const item of bgmItems) {
      const cat = item.category || "Other"
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    // Sort categories alphabetically
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

        <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
          <div className="flex flex-col gap-2 pr-4">
            {/* Loading */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/40" />
            ))}

            {/* Error */}
            {error && !loading && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-center text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Empty */}
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

            {/* ════ Voice flat list ════ */}
            {!loading && isVoice && voiceItems.map((v) => (
              <TrackRow
                key={v.id}
                id={v.id}
                name={v.name}
                preview={v.preview}
                isSelected={selectedId === v.id}
                isPlaying={playingId === v.id}
                brandColor="var(--brand-pink)"
                onPlay={() => handlePlay(v.id, v.preview)}
                onSelect={() => onSelect(v.id, v.name)}
                subtitle="ElevenLabs AI"
              />
            ))}

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
                      {tracks.map((t) => (
                        <TrackRow
                          key={t.id}
                          id={t.id}
                          name={t.name}
                          preview={t.preview}
                          isSelected={selectedId === t.id}
                          isPlaying={playingId === t.id}
                          brandColor="var(--brand-purple)"
                          onPlay={() => handlePlay(t.id, t.preview)}
                          onSelect={() => onSelect(t.id, t.name)}
                          subtitle={category}
                        />
                      ))}
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
