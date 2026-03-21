import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const canonicalOrigin = 'https://www.shortee.tv'
  const safeNext = next.startsWith('/') ? next : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${canonicalOrigin}${safeNext}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${canonicalOrigin}/auth/error?error=Could+not+authenticate`)
}
