// app/api/auth/callback/route.ts
//
// GET /api/auth/callback?code=...
//
// Supabase redirects here after OAuth sign-in (e.g. Google).
// Exchanges the one-time code for a session and sets the cookie,
// then redirects the user to the dashboard.
//
// If you're only using email+password auth, this route is still
// required — Supabase uses it for magic link and email confirmation
// flows too.

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSessionClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Something went wrong — redirect to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}