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

  const user = data.user
  const email = (user.email ?? '').toLowerCase()
  const admin = createAdminClient()

  // Determine role.
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const { data: orgRows } = await admin
    .from('event_organizers')
    .select('id')
    .eq('profile_id', user.id)
    .limit(1)

  const isOrganizer =
    profile?.role === 'superadmin' ||
    profile?.role === 'organizer' ||
    (orgRows?.length ?? 0) > 0

  // For participants (Google sign-in): seed the profile, link their registrations
  // by email, and gate first-login until the mandatory identity is filled in.
  if (!isOrganizer) {
    // Seed participant_profiles on first login (don't overwrite existing values).
    const { data: pp } = await admin
      .from('participant_profiles')
      .select('college_email, register_number, full_name, personal_email')
      .eq('id', user.id)
      .maybeSingle()

    if (!pp) {
      const meta = (user.user_metadata ?? {}) as Record<string, any>
      await admin.from('participant_profiles').upsert({
        id: user.id,
        full_name: meta.full_name || meta.name || null,
        personal_email: email || null,
      })
    }

    // Link any registrations made with this email to the account.
    if (email) {
      await admin
        .from('registrations')
        .update({ participant_id: user.id })
        .eq('leader_email', email)
        .is('participant_id', null)
    }

    // Mandatory identity incomplete → send to the portal onboarding gate first.
    const complete = !!pp?.college_email && !!pp?.register_number
    if (!complete) {
      return NextResponse.redirect(`${origin}/participant/portal`)
    }
  }

  // Honor an explicit ?next when present, otherwise route by role.
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${isOrganizer ? '/dashboard' : '/participant/portal'}`)
}
