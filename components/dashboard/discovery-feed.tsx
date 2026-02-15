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

function FeedCard({ item }: { item: FeedItem }) {
  const [liked, setLiked] = useState(false)

  return (
    <div className="group mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border/25 bg-card transition-all hover:border-border/50 hover:bg-card/80">
      {/* Video preview - all 9:16 vertical with premium border */}
      <div className="relative flex aspect-[9/14] items-center justify-center overflow-hidden rounded-t-xl border-b border-border/15 bg-secondary/30">
        {/* Subtle brand tinted background */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(ellipse at 50% 30%, var(--brand-pink), transparent 70%)`
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <Play className="h-10 w-10 text-muted-foreground/15 transition-transform group-hover:scale-110" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-medium leading-tight text-foreground drop-shadow-lg">
            {item.title}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{item.author}</p>
          <button
            onClick={() => setLiked(!liked)}
            className="rounded-full p-1 transition-colors hover:bg-secondary"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                liked ? "fill-[var(--brand-pink)] text-[var(--brand-pink)]" : "text-muted-foreground"
              )}
            />
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {formatCount(item.likes + (liked ? 1 : 0))}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {formatCount(item.views)}
            </span>
          </div>
        </div>
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
    <section id="discover" className="px-6 py-10">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-[var(--brand-pink)]" />
          Discovery
        </h2>
        <p className="text-sm text-muted-foreground">
          Explore community creations and trending content
        </p>
      </div>

      {loading ? (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mb-4 aspect-[9/14] animate-pulse rounded-xl bg-secondary/30"
            />
          ))}
        </div>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
