// app/api/participant/team/remove/route.ts
// POST — remove a team member (leader only)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { user } } = await sessionSupa.auth.getUser()
    if (!user) return apiError('Unauthorised', 401)

    const { member_id, registration_id } = await req.json()
    const email = user.email!
    const admin = createAdminClient()

    // Verify requester is leader
    const { data: reg } = await admin
      .from('registrations')
      .select('id')
      .eq('id', registration_id)
      .eq('leader_email', email.toLowerCase())
      .maybeSingle()

    if (!reg) return apiError('Only the team leader can remove members')

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
