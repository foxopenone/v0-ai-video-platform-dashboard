"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Check, Mic, Music } from "lucide-react"
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
  onSelect: (id: string) => void
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

  const handlePlay = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    // Simulate audio preview
    setPlayingId(id)
    setTimeout(() => setPlayingId(null), 3000)
  }

  const items = type === "voice" ? voices : bgms

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border/50 bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            {type === "voice" ? (
              <Mic className="h-4 w-4 text-primary" />
            ) : (
              <Music className="h-4 w-4 text-primary" />
            )}
            {type === "voice" ? "Select Voice" : "Select Background Music"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {type === "voice"
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
                    className="h-16 animate-pulse rounded-lg bg-secondary/50"
                  />
                ))
              : items.map((item) => {
                  const isSelected = selectedId === item.id
                  const isPlaying = playingId === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/30 bg-secondary/20 hover:border-border/50 hover:bg-secondary/40"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlay(item.id)
                        }}
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                          isPlaying
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4" />
                        )}
                      </button>

                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type === "voice"
                            ? `${(item as VoiceItem).accent} - ${(item as VoiceItem).gender}`
                            : `${(item as BGMItem).mood} - ${(item as BGMItem).duration}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {type === "bgm" && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {(item as BGMItem).mood}
                          </Badge>
                        )}
                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
