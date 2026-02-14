"use client"

import { Coins, Zap, ChevronDown, User, Settings, LogOut, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          ClipForge
        </span>
      </div>

      <nav className="hidden items-center gap-8 md:flex">
        <a
          href="#workspace"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Workspace
        </a>
        <a
          href="#projects"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Projects
        </a>
        <a
          href="#discover"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Discover
        </a>
        <a
          href="#"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Pricing
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5">
          <Coins className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-foreground">500</span>
          <span className="text-xs text-muted-foreground">credits</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-secondary">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarFallback className="bg-secondary text-sm font-medium text-foreground">
                  JD
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
