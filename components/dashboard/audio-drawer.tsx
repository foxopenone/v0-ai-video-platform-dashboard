"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Check, Mic, Music, Volume2 } from "lucide-react"
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

interface VoiceItem {
  id: string
  name: string
  accent: string
  gender: string
  preview: string
}

interface BGMItem {
  id: string
  name: string
  mood: string
  duration: string
  preview: string
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
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [bgms, setBgms] = useState<BGMItem[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    if (type === "voice") {
      fetchVoices().then((data) => {
        setVoices(data)
        setLoading(false)
      })
    } else {
      fetchBGM().then((data) => {
        setBgms(data)
        setLoading(false)
      })
    }
  }, [open, type])

  // Clean up on close
  useEffect(() => {
    if (!open) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
  }, [open])

  const handlePlay = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    setPlayingId(id)
    // Simulate 3s audio preview
    setTimeout(() => setPlayingId(null), 3000)
  }

  const items = type === "voice" ? voices : bgms
  const isVoice = type === "voice"

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
              ? "Choose a narrator voice powered by Eleven Labs"
              : "Pick background music for your videos"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
          <div className="flex flex-col gap-2 pr-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-secondary/40"
                  />
                ))
              : items.map((item) => {
                  const isSelected = selectedId === item.id
                  const isPlaying = playingId === item.id
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
                          handlePlay(item.id)
                        }}
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                          isPlaying
                            ? "brand-gradient text-[#fff]"
                            : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                        )}
                        aria-label={isPlaying ? "Pause preview" : "Play preview"}
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
                        <p className="text-xs text-muted-foreground">
                          {isVoice
                            ? `${(item as VoiceItem).accent} \u00b7 ${(item as VoiceItem).gender}`
                            : `${(item as BGMItem).mood} \u00b7 ${(item as BGMItem).duration}`}
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
                      {!isVoice && !isPlaying && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-border/30 text-[10px] text-muted-foreground"
                        >
                          {(item as BGMItem).mood}
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
