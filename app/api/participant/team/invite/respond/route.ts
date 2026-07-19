// app/api/participant/team/invite/respond/route.ts
// POST — accept or decline a pending match. Body: { invite_id, action }.
//   'invite'  → the SEEKER responds.
//   'request' → the team CREATOR responds.
// Accepting merges the seeker into the team.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { isTeamCreator } from '@/lib/registrations/access'
import { mergeSeekerIntoTeam } from '@/lib/registrations/merge-into-team'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorised', 401)

    const { invite_id, action } = await req.json()
    if (!invite_id || !['accept', 'decline'].includes(action)) {
      return apiError('invite_id and a valid action are required')
    }

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('team_invites')
      .select('*')
      .eq('id', invite_id)
      .maybeSingle()
    if (!invite) return apiError('Invite not found', 404)
    if (invite.status !== 'pending') return apiError('This invite has already been handled')

    // Only the correct party may respond.
    const responder =
      invite.direction === 'invite'
        ? invite.seeker_participant_id === user.id
        : await isTeamCreator(admin, invite.team_registration_id, user.id, user.email!)
    if (!responder) return apiError('You cannot respond to this invite', 403)

    if (action === 'decline') {
      await admin
        .from('team_invites')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invite_id)
      return apiSuccess({ message: 'Declined' })
    }

    // Accept → merge the seeker into the team.
    const result = await mergeSeekerIntoTeam(
      admin,
      invite.team_registration_id,
      invite.seeker_participant_id,
      invite.seeker_registration_id
    )
    if (result.error) return apiError(result.error)

    await admin
      .from('team_invites')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invite_id)

    return apiSuccess({
      message: `Joined ${result.teamName ?? 'the team'}`,
      registration_id: invite.team_registration_id,
    })
  } catch (err) {
    console.error('[POST /api/participant/team/invite/respond]', err)
    return apiError('Internal server error', 500)
  }
}
