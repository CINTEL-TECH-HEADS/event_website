// app/api/participant/team/join/route.ts
// POST — join a team using an invite code (public, no auth required)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { code, full_name, email } = await req.json()

    if (!code || !full_name || !email) {
      return apiError('code, full_name and email are required')
    }

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('team_invite_codes')
      .select('*, registrations(*, events(*))')
      .eq('code', code.toUpperCase())
      .maybeSingle()

    if (!invite)           return apiError('Invalid invite code')
    if (invite.is_revoked) return apiError('This invite code has been revoked')
    if (new Date() > new Date(invite.expires_at)) return apiError('This invite code has expired')
    if (invite.uses >= invite.max_uses) return apiError('This invite code has already been used')

    const reg   = invite.registrations as any
    const event = reg?.events

    if (reg?.status !== 'confirmed') return apiError('This registration is no longer active')

    // Check email not already in team
    const { data: existingMember } = await admin
      .from('team_members')
      .select('id')
      .eq('registration_id', invite.registration_id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingMember) return apiError('This email is already in the team')

    // Check not already registered for this event
    const { data: alreadyReg } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', invite.event_id)
      .eq('leader_email', email.toLowerCase())
      .maybeSingle()

    if (alreadyReg) return apiError('This email is already registered for this event')

    // Check team max size
    if (event?.max_team_size) {
      const { count } = await admin
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('registration_id', invite.registration_id)

      if ((count ?? 0) >= event.max_team_size) return apiError('Team is already full')
    }

    await admin.from('team_members').insert({
      registration_id: invite.registration_id,
      full_name,
      email: email.toLowerCase(),
      is_leader: false,
    })

    await admin
      .from('team_invite_codes')
      .update({ uses: invite.uses + 1 })
      .eq('id', invite.id)

    return apiSuccess({
      message:    `Successfully joined team for ${event?.title}`,
      team_name:  reg?.team_name,
      event_name: event?.title,
    })
  } catch (err) {
    console.error('[POST /api/participant/team/join]', err)
    return apiError('Internal server error', 500)
  }
}
