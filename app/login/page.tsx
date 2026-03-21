"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function getPublicAppUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase()
    if (host === "localhost" || host === "127.0.0.1") {
      return window.location.origin.replace(/\/$/, "")
    }
    return "https://www.shortee.tv"
  }

  return "https://www.shortee.tv"
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.replace("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getPublicAppUrl()}/auth/callback`,
      },
    })
    if (error) setError(error.message)
  }



  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-pink)]/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-[var(--brand-purple)]/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shortee-icon.png"
              alt="Shortee.TV"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="brand-gradient-text text-xl font-bold tracking-tight">
              Shortee.TV
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/30 bg-card p-6">
          {/* Social Login Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/40 bg-secondary/20 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>


          </div>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-border/40 bg-secondary/15 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--brand-pink)]/40"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-foreground/80">
                  Password
                </label>
                <button type="button" className="text-[11px] text-[var(--brand-pink)] transition-colors hover:text-[var(--brand-pink)]/70">
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-xl border border-border/40 bg-secondary/15 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-[var(--brand-pink)]/40"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="brand-gradient mt-1 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-[#fff] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fff]/30 border-t-[#fff]" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/signup" className="font-medium text-[var(--brand-pink)] transition-colors hover:text-[var(--brand-pink)]/80">
            Sign up
          </Link>
        </p>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
