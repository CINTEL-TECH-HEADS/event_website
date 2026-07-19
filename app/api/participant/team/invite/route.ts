// app/api/participant/team/invite/route.ts
// POST — a team short of members invites an individual seeker.
// Body: { team_registration_id, seeker_participant_id }. The seeker accepts later.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { isTeamCreator } from '@/lib/registrations/access'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorised', 401)

    const { team_registration_id, seeker_participant_id } = await req.json()
    if (!team_registration_id || !seeker_participant_id) {
      return apiError('team_registration_id and seeker_participant_id are required')
    }

    const admin = createAdminClient()

    // Caller must be the team creator.
    if (!(await isTeamCreator(admin, team_registration_id, user.id, user.email!))) {
      return apiError('Only the team creator can invite members', 403)
    }

    const { data: team } = await admin
      .from('registrations')
      .select('id, event_id, is_open, status, members:team_members(id), events(max_team_size)')
      .eq('id', team_registration_id)
      .maybeSingle()
    if (!team) return apiError('Team not found', 404)
    if (team.status !== 'confirmed' || !team.is_open) return apiError('This team is not accepting members')
    const maxSize = (team.events as any)?.max_team_size ?? null
    if (maxSize != null && (team.members as any[]).length >= maxSize) return apiError('Your team is already full')

    // Target must be an open size-1 seeker for the same event.
    const { data: seekerReg } = await admin
      .from('registrations')
      .select('id, members:team_members(id)')
      .eq('event_id', team.event_id)
      .eq('participant_id', seeker_participant_id)
      .eq('registration_type', 'team')
      .eq('is_open', true)
      .maybeSingle()
    if (!seekerReg || (seekerReg.members as any[]).length !== 1) {
      return apiError('That participant is not available to invite')
    }

    const { error } = await admin.from('team_invites').insert({
      event_id:               team.event_id,
      team_registration_id,
      seeker_participant_id,
      seeker_registration_id: seekerReg.id,
      direction:              'invite',
      initiated_by:           user.id,
    })
    if (error) {
      if ((error as any).code === '23505') return apiError('You already have a pending invite to this participant')
      return apiError(error.message, 500)
    }

    return apiSuccess({ message: 'Invitation sent' })
  } catch (err) {
    console.error('[POST /api/participant/team/invite]', err)
    return apiError('Internal server error', 500)
  }
}
