"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ChevronDown, User, Settings, LogOut, Globe, LogIn, Shield } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-full max-w-[1400px] items-center justify-between px-6">
      {/* Logo + Slogan - compact two-line layout */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shortee-icon.png"
          alt="Shortee.TV"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
        <div className="flex flex-col justify-center">
          <span className="brand-gradient-text text-[17px] font-bold leading-tight tracking-tight">
            Shortee.TV
          </span>
          <span className="text-[10px] font-medium leading-tight tracking-wide text-muted-foreground/80">
            One-Click AI Mini Drama Clipper
          </span>
        </div>
      </div>

      {/* Center Nav */}
      <nav className="hidden items-center gap-1 md:flex">
        {[
          { label: "Workspace", href: "#workspace" },
          { label: "Projects", href: "#projects" },
          { label: "Discover", href: "#discover" },
          { label: "Pricing", href: "#pricing" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>

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

        {/* Auth: Login buttons or User Avatar */}
        {loading ? (
          <div className="h-7 w-7 animate-pulse rounded-full bg-secondary/50" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-secondary/50">
                <Avatar className="h-7 w-7 border border-border/40">
                  <AvatarFallback className="text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, rgba(244,63,122,0.15), rgba(168,85,247,0.15))' }}>
                    <span className="text-foreground">
                      {user.email?.slice(0, 2).toUpperCase() || "U"}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <div className="px-2 py-1.5">
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  <Shield className="mr-2 h-3.5 w-3.5" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  setUser(null)
                  router.push("/login")
                }}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md border border-border/40 bg-secondary/30 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            >
              <LogIn className="h-3 w-3" />
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #F43F7A, #A855F7)' }}
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
      </div>
    </header>
  )
}
