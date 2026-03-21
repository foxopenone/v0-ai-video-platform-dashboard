import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  if (request.nextUrl.protocol === 'http:' && request.nextUrl.hostname !== 'localhost' && request.nextUrl.hostname !== '127.0.0.1') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.protocol = 'https:'
    return NextResponse.redirect(redirectUrl)
  }

  if (request.nextUrl.hostname.toLowerCase() === 'shortee.tv') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.protocol = 'https:'
    redirectUrl.hostname = 'www.shortee.tv'
    return NextResponse.redirect(redirectUrl)
  }

  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/callback'
    return NextResponse.redirect(redirectUrl)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only redirect: logged-in users visiting /login or /signup go to dashboard
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', '/admin')
      return NextResponse.redirect(url)
    }

    const adminEmails = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    const userEmail = String(user.email || '').trim().toLowerCase()

    if (adminEmails.length === 0 || !userEmail || !adminEmails.includes(userEmail)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // All other pages (including /) are accessible without login
  supabaseResponse.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  )
  return supabaseResponse
}
