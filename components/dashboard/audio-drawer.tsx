"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Check, Mic, Music, Volume2, AlertCircle } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { fetchVoices, fetchBGM } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

/** Unified item shape for both voice and BGM */
interface AudioItem {
  id: string
  name: string
  preview: string // audio URL (may be empty for BGM mocks)
  // BGM-only fields
  mood?: string
  duration?: string
}

interface AudioDrawerProps {
  type: "voice" | "bgm"
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onSelect: (id: string, name: string) => void
}

export function AudioDrawer({
  type,
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: AudioDrawerProps) {
  const [items, setItems] = useState<AudioItem[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isVoice = type === "voice"

  // Load data when drawer opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)

    if (isVoice) {
      fetchVoices()
        .then((data) => {
          // data: { id: ElevenLabs_ID, name, preview }
          setItems(data.map((v) => ({ id: v.id, name: v.name, preview: v.preview })))
          setLoading(false)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load voices")
          setLoading(false)
        })
    } else {
      fetchBGM()
        .then((data) => {
          setItems(data.map((b) => ({
            id: b.id,
            name: b.name,
            preview: b.preview,
            mood: b.mood,
            duration: b.duration,
          })))
          setLoading(false)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load BGM")
          setLoading(false)
        })
    }
  }, [open, isVoice])

  // Clean up audio on close
  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      setPlayingId(null)
    }
  }, [open])

  /** Play/pause real audio preview */
  const handlePlay = useCallback((item: AudioItem) => {
    // If already playing this item, pause
    if (playingId === item.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    // No preview URL available
    if (!item.preview || item.preview === "#") {
      return
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    // Create new audio element and play
    const audio = new Audio(item.preview)
    audio.crossOrigin = "anonymous"
    audioRef.current = audio

    audio.addEventListener("ended", () => {
      setPlayingId(null)
    })

    audio.addEventListener("error", () => {
      setPlayingId(null)
    })

    audio.play().then(() => {
      setPlayingId(item.id)
    }).catch(() => {
      setPlayingId(null)
    })
  }, [playingId])

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
              : "Pick background music for your videos"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
          <div className="flex flex-col gap-2 pr-4">
            {/* Loading skeleton */}
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-secondary/40"
                />
              ))}

            {/* Error state */}
            {error && !loading && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-center text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Mic className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No voices available</p>
              </div>
            )}

            {/* Voice / BGM items */}
            {!loading &&
              items.map((item) => {
                const isSelected = selectedId === item.id
                const isPlaying = playingId === item.id
                const hasPreview = !!item.preview && item.preview !== "#"
                const brandColor = isVoice ? "var(--brand-pink)" : "var(--brand-purple)"

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(item.id, item.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(item.id, item.name)
                      }
                    }}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? "border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/5"
                        : "border-border/20 bg-secondary/15 hover:border-border/40 hover:bg-secondary/30"
                    )}
                  >
                    {/* Play/Pause button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlay(item)
                      }}
                      disabled={!hasPreview}
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                        isPlaying
                          ? "brand-gradient text-[#fff]"
                          : hasPreview
                            ? "bg-secondary/60 text-muted-foreground hover:text-foreground"
                            : "cursor-not-allowed bg-secondary/30 text-muted-foreground/30"
                      )}
                      aria-label={isPlaying ? "Pause preview" : hasPreview ? "Play preview" : "No preview"}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4" />
                      )}
                    </button>

                    {/* Name and meta */}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      {/* BGM shows mood/duration, voice shows ElevenLabs tag */}
                      <p className="text-xs text-muted-foreground">
                        {isVoice
                          ? "ElevenLabs AI"
                          : `${item.mood || ""} \u00b7 ${item.duration || ""}`}
                      </p>
                    </div>

                    {/* Waveform indicator when playing */}
                    {isPlaying && (
                      <Volume2
                        className="h-4 w-4 shrink-0 animate-pulse"
                        style={{ color: brandColor }}
                      />
                    )}

                    {/* Mood badge for BGM */}
                    {!isVoice && !isPlaying && item.mood && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-border/30 text-[10px] text-muted-foreground"
                      >
                        {item.mood}
                      </Badge>
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
