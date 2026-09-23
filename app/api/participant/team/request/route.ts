// app/api/participant/team/request/route.ts
// POST — a seeker asks to join a team. Body: { team_registration_id }.
// The team creator accepts later.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorised', 401)

    const { team_registration_id } = await req.json()
    if (!team_registration_id) return apiError('team_registration_id is required')

    const admin = createAdminClient()

    const { data: team } = await admin
      .from('registrations')
      .select('id, event_id, participant_id, is_open, status, payment_status, members:team_members(id), events(max_team_size)')
      .eq('id', team_registration_id)
      .maybeSingle()
    if (!team) return apiError('Team not found', 404)
    if (team.participant_id === user.id) return apiError('This is your own team')
    if (team.payment_status === 'paid') return apiError('This team is locked after payment')
    if (team.status !== 'confirmed' || !team.is_open) return apiError('This team is not accepting members')
    const maxSize = (team.events as any)?.max_team_size ?? null
    if (maxSize != null && (team.members as any[]).length >= maxSize) return apiError('This team is already full')

    // Caller must own an open size-1 seeker registration for the same event.
    const { data: seekerReg } = await admin
      .from('registrations')
      .select('id, members:team_members(id)')
      .eq('event_id', team.event_id)
      .eq('participant_id', user.id)
      .eq('registration_type', 'team')
      .eq('is_open', true)
      .maybeSingle()
    if (!seekerReg || (seekerReg.members as any[]).length !== 1) {
      return apiError('Register with "Find a team" first, then request to join a team')
    }

    const { error } = await admin.from('team_invites').insert({
      event_id:               team.event_id,
      team_registration_id,
      seeker_participant_id:  user.id,
      seeker_registration_id: seekerReg.id,
      direction:              'request',
      initiated_by:           user.id,
    })
    if (error) {
      if ((error as any).code === '23505') return apiError('You already have a pending request to this team')
      return apiError(error.message, 500)
    }

    return apiSuccess({ message: 'Request sent' })
  } catch (err) {
    console.error('[POST /api/participant/team/request]', err)
    return apiError('Internal server error', 500)
  }
}
