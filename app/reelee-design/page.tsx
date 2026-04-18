"use client"

import { Search, Settings, Play, Plus, ChevronLeft, ChevronRight, Flame, Sparkles } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

// Mock data for the design
const featuredDrama = {
  title: "I Made a Deal with the Future",
  subtitle: "我与未来做交易",
  episode: "Episode 1",
  image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg",
}

const rankingDramas = [
  { id: 1, title: "After Being Hurt by a Scumbag", image: "/placeholder.svg?height=200&width=140" },
  { id: 2, title: "Oops, My Cat Princess Identity", image: "/placeholder.svg?height=200&width=140" },
  { id: 3, title: "Different Names, Same Love", image: "/placeholder.svg?height=200&width=140" },
  { id: 4, title: "After the Storm", image: "/placeholder.svg?height=200&width=140" },
]

const newReleases = [
  { id: 1, title: "Daddy, You Got the Wrong Mommy", image: "/placeholder.svg?height=200&width=140" },
  { id: 2, title: "Secret Romance", image: "/placeholder.svg?height=200&width=140" },
  { id: 3, title: "Love in the City", image: "/placeholder.svg?height=200&width=140" },
  { id: 4, title: "Destined Hearts", image: "/placeholder.svg?height=200&width=140" },
]

const tabs = ["All", "Ranking", "Micro", "New", "Trending"]

const navItems = [
  { icon: "dramas", label: "Dramas", active: true },
  { icon: "list", label: "My List", active: false },
  { icon: "shorts", label: "Shorts", active: false },
  { icon: "rewards", label: "Rewards", active: false },
  { icon: "me", label: "Me", active: false },
]

export default function ReeLeeDesignPage() {
  const [activeTab, setActiveTab] = useState("All")

  return (
    <div className="min-h-screen bg-[#08080c] text-white font-sans max-w-[430px] mx-auto relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0c14] via-transparent to-[#08080c] pointer-events-none" />
      
      {/* Status bar simulation */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-3 pb-2">
        <span className="text-sm font-medium tracking-tight">03:04</span>
        <div className="flex items-center gap-1">
          <span className="text-xs">SOS</span>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white/50 rounded-full" />
          </div>
          <div className="w-6 h-3 border border-white/60 rounded-sm ml-1">
            <div className="w-3 h-full bg-white/60 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative z-10 px-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[#16151f] rounded-2xl px-4 py-3 border border-[#252336]/50">
            <Search className="w-5 h-5 text-[#6b6788]" />
            <input
              type="text"
              placeholder="Search dramas..."
              className="bg-transparent text-sm text-white/90 placeholder-[#6b6788] outline-none flex-1"
            />
          </div>
          <button className="w-11 h-11 rounded-xl bg-[#16151f] border border-[#252336]/50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#c9a87c]" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="relative z-10 px-4 pb-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                activeTab === tab
                  ? "text-[#c9a87c] relative"
                  : "text-[#6b6788] hover:text-white/70"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-[#c9a87c] to-[#d4b896] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banner */}
      <div className="relative z-10 px-4 pb-6">
        <div className="relative rounded-3xl overflow-hidden aspect-[16/10] group">
          {/* Background Image with overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080c]/60 via-transparent to-[#08080c]/60 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${featuredDrama.image})` }}
          />
          
          {/* Navigation Arrows */}
          <button className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/50 transition-colors">
            <ChevronRight className="w-5 h-5 text-white/80" />
          </button>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
            <h2 className="text-xl font-semibold text-white mb-1 tracking-tight">
              {featuredDrama.title}
            </h2>
            <p className="text-sm text-white/50 mb-4">
              {featuredDrama.subtitle} · {featuredDrama.episode}
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#c9a87c] to-[#d4b896] rounded-full text-[#1a1714] font-semibold text-sm shadow-lg shadow-[#c9a87c]/20 hover:shadow-[#c9a87c]/40 transition-shadow">
                <Play className="w-4 h-4 fill-current" />
                Watch
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white/90 font-medium text-sm border border-white/10 hover:bg-white/15 transition-colors">
                <Plus className="w-4 h-4" />
                My List
              </button>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5">
            <div className="w-5 h-1.5 rounded-full bg-[#c9a87c]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* Ranking Section */}
      <div className="relative z-10 pb-6">
        <div className="flex items-center gap-2 px-4 mb-4">
          <h3 className="text-lg font-semibold text-white tracking-tight">Ranking</h3>
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931e] flex items-center justify-center">
            <Flame className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {rankingDramas.map((drama, index) => (
            <div key={drama.id} className="flex-shrink-0 w-[140px] group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden mb-2 aspect-[3/4] bg-[#16151f]">
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#c9a87c]">{index + 1}</span>
                </div>
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-[#c9a87c]/20 to-transparent" />
                
                {/* Image Placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-[#1e1d2a] to-[#16151f] flex items-center justify-center">
                  <span className="text-[#6b6788] text-xs">Cover</span>
                </div>
                
                {/* Bottom Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <p className="text-sm text-white/80 font-medium line-clamp-2 leading-tight group-hover:text-[#c9a87c] transition-colors">
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases Section */}
      <div className="relative z-10 pb-28">
        <div className="flex items-center gap-2 px-4 mb-4">
          <h3 className="text-lg font-semibold text-white tracking-tight">New Releases</h3>
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#c9a87c] to-[#9b7f5a] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {newReleases.map((drama) => (
            <div key={drama.id} className="flex-shrink-0 w-[140px] group cursor-pointer">
              <div className="relative rounded-2xl overflow-hidden mb-2 aspect-[3/4] bg-[#16151f]">
                {/* New Badge */}
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#c9a87c] to-[#d4b896] text-[10px] font-bold text-[#1a1714] uppercase tracking-wider">
                  New
                </div>
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-[#c9a87c]/20 to-transparent" />
                
                {/* Image Placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-[#1e1d2a] to-[#16151f] flex items-center justify-center">
                  <span className="text-[#6b6788] text-xs">Cover</span>
                </div>
                
                {/* Bottom Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <p className="text-sm text-white/80 font-medium line-clamp-2 leading-tight group-hover:text-[#c9a87c] transition-colors">
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto">
        <div className="bg-[#0d0c14]/95 backdrop-blur-xl border-t border-[#252336]/30 px-2 pb-8 pt-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  item.active
                    ? "text-[#c9a87c]"
                    : "text-[#6b6788] hover:text-white/70"
                }`}
              >
                {item.icon === "dramas" && (
                  <div className={`relative ${item.active ? "drop-shadow-[0_0_8px_rgba(201,168,124,0.5)]" : ""}`}>
                    <Play className={`w-6 h-6 ${item.active ? "fill-[#c9a87c]" : ""}`} />
                  </div>
                )}
                {item.icon === "list" && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                )}
                {item.icon === "shorts" && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
                {item.icon === "rewards" && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                )}
                {item.icon === "me" && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
                <span className={`text-[10px] font-medium tracking-wide ${item.active ? "text-[#c9a87c]" : ""}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  )
}
