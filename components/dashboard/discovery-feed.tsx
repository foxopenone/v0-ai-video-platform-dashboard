"use client"

import { useState, useEffect } from "react"
import { Heart, Eye, Play, Sparkles } from "lucide-react"
import { fetchDiscoveryFeed } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

interface FeedItem {
  id: string
  title: string
  author: string
  likes: number
  views: number
  aspect: string
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Deterministic gradients for visual variety
const FEED_GRADIENTS = [
  "radial-gradient(ellipse at 30% 25%, rgba(244,63,122,0.22), rgba(60,20,80,0.3) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 70% 60%, rgba(168,85,247,0.22), rgba(80,30,60,0.25) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 50% 40%, rgba(200,70,160,0.18), rgba(100,40,140,0.2) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 40% 75%, rgba(244,63,122,0.16), rgba(168,85,247,0.16) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 65% 30%, rgba(168,85,247,0.20), rgba(60,30,80,0.22) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 35% 55%, rgba(244,63,122,0.20), rgba(140,50,200,0.12) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 55% 20%, rgba(180,60,180,0.20), rgba(80,40,120,0.18) 55%, rgba(8,8,16,0.97))",
  "radial-gradient(ellipse at 45% 65%, rgba(244,63,122,0.18), rgba(100,50,160,0.16) 55%, rgba(8,8,16,0.97))",
]

function FeedCard({ item, index }: { item: FeedItem; index: number }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="group mb-3 break-inside-avoid overflow-hidden rounded-xl border border-border/25 bg-card transition-all hover:border-border/50">
      {/* Strict 9:16 vertical thumbnail with gradient + play overlay */}
      <div
        className="relative flex aspect-[9/16] items-center justify-center overflow-hidden rounded-t-xl"
        style={{ backgroundImage: FEED_GRADIENTS[index % FEED_GRADIENTS.length] }}
      >
        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Play overlay */}
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/25 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Play className="h-5 w-5 text-foreground/50 transition-colors group-hover:text-[var(--brand-pink)]" />
        </div>

        {/* Title at bottom */}
        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-8">
          <p className="text-xs font-medium leading-snug text-foreground drop-shadow-lg">
            {item.title}
          </p>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between px-2.5 py-2">
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-[10px] text-muted-foreground">{item.author}</p>
          <div className="mt-0.5 flex items-center gap-2.5">
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70">
              <Heart className="h-2.5 w-2.5" />
              {formatCount(item.likes + (liked ? 1 : 0))}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/70">
              <Eye className="h-2.5 w-2.5" />
              {formatCount(item.views)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              liked
                ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]"
                : "text-muted-foreground"
            )}
          />
        </button>
      </div>
    </div>
  )
}

export function DiscoveryFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDiscoveryFeed().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  return (
    <section id="discover" className="px-5 py-5">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[var(--brand-pink)]" />
          Discovery
        </h2>
        <p className="text-xs text-muted-foreground">
          Explore community creations and trending content
        </p>
      </div>

      {loading ? (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4 xl:columns-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mb-3 aspect-[9/16] animate-pulse rounded-xl bg-secondary/20"
            />
          ))}
        </div>
      ) : (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4 xl:columns-5">
          {items.map((item, i) => (
            <FeedCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
