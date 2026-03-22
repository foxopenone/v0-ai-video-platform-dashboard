"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function getSafeNext(raw: string | null): string {
  if (!raw) return "/"
  return raw.startsWith("/") ? raw : "/"
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      if (window.location.hostname.toLowerCase() === "shortee.tv") {
        window.location.replace(`https://www.shortee.tv${window.location.pathname}${window.location.search}${window.location.hash}`)
        return
      }

      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const next = getSafeNext(params.get("next"))
      const errorFromProvider = params.get("error_description") || params.get("error")

      if (errorFromProvider) {
        router.replace(`/auth/error?error=${encodeURIComponent(errorFromProvider)}`)
        return
      }

      const waitForSession = async (tries = 20, delayMs = 150) => {
        for (let i = 0; i < tries; i += 1) {
          const { data } = await supabase.auth.getSession()
          if (data.session) return true
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
        return false
      }

      try {
        const { data: pre } = await supabase.auth.getSession()
        if (pre.session) {
          router.replace(next)
          return
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            const { data: postErrorSession } = await supabase.auth.getSession()
            if (postErrorSession.session) {
              router.replace(next)
              return
            }
            if (/pkce code verifier not found/i.test(error.message || "")) {
              router.replace(`/login?next=${encodeURIComponent(next)}`)
              return
            }
            const msg = encodeURIComponent(error.message || "Could not authenticate")
            router.replace(`/auth/error?error=${msg}`)
            return
          }
        }

        if (!code) {
          const { data: noCodeSession } = await supabase.auth.getSession()
          if (!noCodeSession.session) {
            router.replace(`/login?next=${encodeURIComponent(next)}`)
            return
          }
        }

        const ok = await waitForSession()
        if (!ok) {
          router.replace("/auth/error?error=Could+not+authenticate")
          return
        }

        router.replace(next)
      } catch {
        router.replace("/auth/error?error=Could+not+authenticate")
      }
    }

    void run()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
      Signing in...
    </div>
  )
}
