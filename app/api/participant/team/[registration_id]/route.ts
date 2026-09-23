// app/api/participant/team/[registration_id]/route.ts
// PATCH — team creator updates the team: rename and/or open/close for the Finder.
// Body: { team_name?: string, is_open?: boolean }

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { isTeamCreator, isTeamLocked } from '@/lib/registrations/access'
import { isTeamNameTaken } from '@/lib/registrations/team-name'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ registration_id: string }> }
) {
  try {
    const { registration_id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorised', 401)

    const admin = createAdminClient()
    if (!(await isTeamCreator(admin, registration_id, user.id, user.email!))) {
      return apiError('Only the team creator can update the team', 403)
    }
    if (await isTeamLocked(admin, registration_id)) {
      return apiError('Team is locked after payment')
    }

    const body = await req.json().catch(() => ({}))
    const update: Record<string, unknown> = {}

    if (typeof body.team_name === 'string') {
      const name = body.team_name.trim()
      if (name.length < 2) return apiError('Team name must be at least 2 characters')
      // Unique per event (excluding this registration).
      const { data: reg } = await admin
        .from('registrations')
        .select('event_id')
        .eq('id', registration_id)
        .maybeSingle()
      if (reg && (await isTeamNameTaken(admin, reg.event_id, name, registration_id))) {
        return apiError('That team name is already taken for this event.')
      }
      update.team_name = name
    }
    if (typeof body.is_open === 'boolean') {
      update.is_open = body.is_open
    }
    if (Object.keys(update).length === 0) return apiError('Nothing to update')

    const { data, error } = await admin
      .from('registrations')
      .update(update)
      .eq('id', registration_id)
      .select('id, team_name, is_open')
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    console.error('[PATCH /api/participant/team/[registration_id]]', err)
    return apiError('Internal server error', 500)
  }
}
