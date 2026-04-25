// middleware.ts
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

export async function middleware(request: NextRequest) {
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
    const loginUrl = request.nextUrl.clone()

    if (isParticipantRoute) {
      // Participant routes redirect to participant login
      loginUrl.pathname = '/participant/login'
    } else {
      // Organizer routes redirect to organizer login
      loginUrl.pathname = '/login'
    }

    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

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
