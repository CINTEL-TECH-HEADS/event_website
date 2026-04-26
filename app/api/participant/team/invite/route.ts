// app/api/participant/team/invite/route.ts
// POST — generate invite code for team leader

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CINTEL-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { user } } = await sessionSupa.auth.getUser()
    if (!user) return apiError('Unauthorised', 401)

    const { registration_id, max_uses = 1 } = await req.json()
    const email = user.email!
    const admin = createAdminClient()

    // Verify requester is the leader
    const { data: reg } = await admin
      .from('registrations')
      .select('id, event_id, team_name, members:team_members(id)')
      .eq('id', registration_id)
      .eq('leader_email', email.toLowerCase())
      .maybeSingle()

    if (!reg) return apiError('Registration not found or you are not the leader')

    // Check event max_team_size
    const { data: event } = await admin
      .from('events')
      .select('max_team_size')
      .eq('id', reg.event_id)
      .maybeSingle()

    const currentSize = (reg.members as any[])?.length ?? 0
    if (event?.max_team_size && currentSize >= event.max_team_size) {
      return apiError('Team is already at maximum size')
    }

    // Expire existing active codes
    await admin
      .from('team_invite_codes')
      .update({ is_revoked: true })
      .eq('registration_id', registration_id)
      .eq('is_revoked', false)

    // Generate unique code
    let code = generateInviteCode()
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await admin
        .from('team_invite_codes')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (!existing) break
      code = generateInviteCode()
    }

    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const { data: invite, error } = await admin
      .from('team_invite_codes')
      .insert({
        code,
        registration_id,
        event_id: reg.event_id,
        created_by_email: email,
        max_uses,
        expires_at,
      })
      .select()
      .single()

    if (error) return apiError(error.message, 500)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    return apiSuccess({
      code:       invite.code,
      link:       `${appUrl}/join/${invite.code}`,
      expires_at: invite.expires_at,
    })
  } catch (err) {
    console.error('[POST /api/participant/team/invite]', err)
    return apiError('Internal server error', 500)
  }
}
