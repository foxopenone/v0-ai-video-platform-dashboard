"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, User, Settings, LogOut, Globe } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "中", label: "Chinese" },
  { code: "한", label: "Korean" },
  { code: "ع", label: "Arabic" },
]

export function Header() {
  const [lang, setLang] = useState("EN")

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-full max-w-[1400px] items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Image
          src="/images/shortee-icon.jpg"
          alt="Shortee.TV"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span className="brand-gradient-text text-base font-bold tracking-tight">
          Shortee.TV
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 rounded-md border border-border/40 bg-secondary/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground">
              <Globe className="h-3 w-3" />
              <span className="font-medium">{lang}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => setLang(l.code)}
                className={lang === l.code ? "text-foreground" : "text-muted-foreground"}
              >
                <span className="mr-2 w-5 text-center font-medium">{l.code}</span>
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-secondary/50">
              <Avatar className="h-7 w-7 border border-border/40">
                <AvatarFallback className="brand-gradient text-[10px] font-bold text-[var(--brand-pink)]" style={{ background: 'linear-gradient(135deg, rgba(244,63,122,0.15), rgba(168,85,247,0.15))' }}>
                  <span className="text-foreground">JD</span>
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>
              <User className="mr-2 h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  )
}
