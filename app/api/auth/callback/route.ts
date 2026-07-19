// app/api/auth/callback/route.ts
//
// GET /api/auth/callback?code=...
//
// Landing point for email confirmation, password recovery, magic link and OAuth.
// Exchanges the one-time code for a session, then sends the user to the right
// place based on their role (organizer → /dashboard, participant → /portal).

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createSessionClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Honor an explicit ?next when present, otherwise route by role
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()
  const { data: orgRows } = await admin
    .from('event_organizers')
    .select('id')
    .eq('profile_id', data.user.id)
    .limit(1)

  const isOrganizer =
    profile?.role === 'superadmin' ||
    profile?.role === 'organizer' ||
    (orgRows?.length ?? 0) > 0

  return NextResponse.redirect(`${origin}${isOrganizer ? '/dashboard' : '/participant/portal'}`)
}
