"use client"

import { Search, Play, Plus, ChevronLeft, ChevronRight, Flame, Sparkles, Coins } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

// 严格按照原设计的数据
const featuredDrama = {
  title: "I made a deal with the future",
  subtitle: "我与未来做交易-1",
  image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg",
}

const rankingDramas = [
  { id: 1, title: "After Being Hurt by a Scumbag", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
  { id: 2, title: "Oops, My Cat Princess Identity is Out!", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
  { id: 3, title: "Different Names, Same Love", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
  { id: 4, title: "After the Storm", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
]

const newReleases = [
  { id: 1, title: "Daddy, You Got the Wrong Mommy!", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
  { id: 2, title: "Secret Romance", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
  { id: 3, title: "Love in the City", cover: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01-idCSPSBcN6l5h0ZMTEp4yH33ZC0Trg.jpg" },
]

const tabs = ["All", "Ranking", "Micro", "New", "Trending"]

export default function ReeLeeHomePage() {
  const [activeTab, setActiveTab] = useState("All")

  return (
    // 手机尺寸: 390x844 (iPhone 14 标准)
    <div className="relative mx-auto h-[844px] w-[390px] overflow-hidden bg-[#0a0a0f] font-sans text-white">
      
      {/* 状态栏 - 完全按照原设计 */}
      <div className="flex items-center justify-between px-6 pb-2 pt-3">
        <span className="text-sm font-semibold">03:04</span>
        <div className="flex items-center gap-1">
          <span className="text-xs">SOS</span>
          <div className="flex gap-0.5">
            <div className="h-1 w-1 rounded-full bg-white"></div>
            <div className="h-1 w-1 rounded-full bg-white"></div>
            <div className="h-1 w-1 rounded-full bg-white/40"></div>
            <div className="h-1 w-1 rounded-full bg-white/40"></div>
          </div>
          <div className="ml-1 flex h-3 w-6 items-center rounded-sm border border-white/60 p-px">
            <div className="h-full w-1/2 rounded-sm bg-white/60"></div>
          </div>
        </div>
      </div>

      {/* 搜索栏 + 充值按钮 (原设计右上角是coins按钮) */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-1 items-center gap-3 rounded-full bg-[#1a1a24] px-4 py-3">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search dramas..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-gray-500 outline-none"
          />
        </div>
        {/* 充值按钮 - 粉红渐变，更有活力 */}
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30">
          <Coins className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* 分类标签 - 使用粉色高亮，更鲜艳 */}
      <div className="flex gap-1 px-4 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "text-pink-500" : "text-gray-500"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
            )}
          </button>
        ))}
      </div>

      {/* 轮播图 Banner - 按原设计比例 */}
      <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl" style={{ height: "220px" }}>
        {/* 背景图 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
          <Image
            src={featuredDrama.image}
            alt={featuredDrama.title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* 左右箭头 */}
        <button className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <ChevronLeft className="h-5 w-5 text-white/80" />
        </button>
        <button className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <ChevronRight className="h-5 w-5 text-white/80" />
        </button>

        {/* 内容区 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="mb-1 text-lg font-bold leading-tight">{featuredDrama.title}</h2>
          <p className="mb-3 text-xs text-white/60">{featuredDrama.subtitle}</p>
          
          {/* 按钮组 - 粉色Watch按钮 */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/40">
              <Play className="h-4 w-4 fill-white" />
              Watch
            </button>
            <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
              <Plus className="h-4 w-4" />
              List
            </button>
          </div>
        </div>

        {/* 分页点 */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          <div className="h-1.5 w-5 rounded-full bg-pink-500" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Ranking 板块 */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2 px-4">
          <h3 className="text-base font-bold">Ranking</h3>
          <span className="text-lg">🔥</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {rankingDramas.map((drama) => (
            <div key={drama.id} className="w-[120px] flex-shrink-0">
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-xl bg-gray-800">
                <Image
                  src={drama.cover}
                  alt={drama.title}
                  fill
                  className="object-cover"
                />
                {/* 渐变叠加让封面更有层次 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-tight text-white/90">
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Releases 板块 */}
      <div className="mb-20">
        <div className="mb-3 flex items-center gap-2 px-4">
          <h3 className="text-base font-bold">New Releases</h3>
          <span className="text-lg">✨</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {newReleases.map((drama) => (
            <div key={drama.id} className="w-[120px] flex-shrink-0">
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-xl bg-gray-800">
                <Image
                  src={drama.cover}
                  alt={drama.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <p className="line-clamp-2 text-xs font-medium leading-tight text-white/90">
                {drama.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 底部导航栏 - 按原设计，粉色选中态 */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#0a0a0f]/95 pb-6 pt-2 backdrop-blur-xl">
        <div className="flex justify-around">
          {[
            { icon: "dramas", label: "Dramas", active: true },
            { icon: "list", label: "My List", active: false },
            { icon: "shorts", label: "Shorts", active: false },
            { icon: "rewards", label: "Rewards", active: false },
            { icon: "me", label: "Me", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-1 ${
                item.active ? "text-pink-500" : "text-gray-500"
              }`}
            >
              {item.icon === "dramas" && (
                <Play className={`h-6 w-6 ${item.active ? "fill-pink-500" : ""}`} />
              )}
              {item.icon === "list" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              )}
              {item.icon === "shorts" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
              {item.icon === "rewards" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                </svg>
              )}
              {item.icon === "me" && (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  )
}
