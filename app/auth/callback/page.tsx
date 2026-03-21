"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function getSafeNext(raw: string | null): string {
  if (!raw) return "/"
  return raw.startsWith("/") ? raw : "/"
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const next = getSafeNext(params.get("next"))

      if (!code) {
        router.replace("/auth/error?error=Could+not+authenticate")
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          const msg = encodeURIComponent(error.message || "Could not authenticate")
          router.replace(`/auth/error?error=${msg}`)
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
