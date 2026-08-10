// app/api/participant/team/remove/route.ts
// POST — remove a team member (leader only)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isTeamCreator, isTeamLocked } from '@/lib/registrations/access'

export async function POST(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { user } } = await sessionSupa.auth.getUser()
    if (!user) return apiError('Unauthorised', 401)

    const { member_id, registration_id } = await req.json()
    const admin = createAdminClient()

    // Verify requester is the team creator (account-based).
    if (!(await isTeamCreator(admin, registration_id, user.id, user.email!))) {
      return apiError('Only the team creator can remove members')
    }
    if (await isTeamLocked(admin, registration_id)) {
      return apiError('Team is locked after payment')
    }

    const { data: member } = await admin
      .from('team_members')
      .select('full_name, email, is_leader')
      .eq('id', member_id)
      .eq('registration_id', registration_id)
      .maybeSingle()

    if (!member)       return apiError('Member not found')
    if (member.is_leader) return apiError('Cannot remove the team leader')

    await admin.from('team_members').delete().eq('id', member_id)

    return apiSuccess({ message: `${member.full_name} removed from team` })
  } catch (err) {
    console.error('[POST /api/participant/team/remove]', err)
    return apiError('Internal server error', 500)
  }
}
