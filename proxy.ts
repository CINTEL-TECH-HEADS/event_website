// proxy.ts (Next 16's name for middleware)
// Protects organizer routes (/dashboard, /judge) and participant portal (/participant/portal)

import { createServerClient } from '@supabase/ssr'
import { NextResponse }        from 'next/server'
import type { NextRequest }    from 'next/server'

type CookieItem = {
  name:    string
  value:   string
  options?: any
}

const ORGANIZER_ROUTES    = ['/dashboard', '/judge']
const PARTICIPANT_ROUTES  = ['/participant/portal']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isOrganizerRoute   = ORGANIZER_ROUTES.some(p => pathname.startsWith(p))
  const isParticipantRoute = PARTICIPANT_ROUTES.some(p => pathname.startsWith(p))

  if (!isOrganizerRoute && !isParticipantRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Single login for both organizers and participants — role decides the destination
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    const redirect = NextResponse.redirect(loginUrl)
    redirect.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    return redirect
  }

  // Never let the browser (or bfcache) serve an authenticated page after logout / back.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/judge/:path*',
    '/participant/portal/:path*',
    '/login',
  ],
}
