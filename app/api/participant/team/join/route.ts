// app/api/participant/team/join/route.ts
// POST — join a team (group-code model, authenticated).
// Body: { code } (group code) OR { registration_id } (from the Team Finder).
// The joiner is linked to their account (participant_id) and shares the team QR.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { findUserRegistration } from '@/lib/registrations/is-registered'
import { canAccessEvent, isExternalParticipant, SRM_ONLY_MESSAGE } from '@/lib/participants/identity'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in to join a team.', 401)

    const body = await req.json().catch(() => ({}))
    const rawCode: string | undefined = body.code
    const registrationId: string | undefined = body.registration_id
    if (!rawCode && !registrationId) {
      return apiError('A team code or team is required')
    }

    const admin = createAdminClient()

    // Resolve the team registration by group code or id.
    let query = admin
      .from('registrations')
      .select('id, event_id, team_name, status, is_open, registration_type, payment_status, events(title, max_team_size, registration_closes_at, open_to_external)')
    query = rawCode
      ? query.eq('group_code', rawCode.toUpperCase().trim())
      : query.eq('id', registrationId!)
    const { data: team } = await query.maybeSingle()

    if (!team || team.registration_type !== 'team') return apiError('Team not found')
    if (team.status !== 'confirmed') return apiError('This team is no longer active')
    if (team.payment_status === 'paid') return apiError('This team is locked after payment')
    if (!team.is_open) return apiError('This team is not accepting new members')

    const event = team.events as any
    if (event?.registration_closes_at && new Date() > new Date(event.registration_closes_at)) {
      return apiError('Registration has closed for this event')
    }
    if (!canAccessEvent(await isExternalParticipant(admin, user.id), event ?? {})) {
      return apiError(SRM_ONLY_MESSAGE, 403)
    }

    // Already registered for this event (own reg or another team)?
    const existing = await findUserRegistration(admin, team.event_id, user.id, user.email!)
    if (existing) {
      if (existing.id === team.id) return apiError('You are already in this team')
      return apiError('You are already registered for this event')
    }

    // Team capacity (members incl. the creator).
    const { count } = await admin
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('registration_id', team.id)
    if (event?.max_team_size && (count ?? 0) >= event.max_team_size) {
      return apiError('This team is already full')
    }

    // Pull name from the participant's profile (fallback to email local-part).
    const { data: profile } = await admin
      .from('participant_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    const fullName = profile?.full_name || user.email!.split('@')[0]

    const { error: insertErr } = await admin.from('team_members').insert({
      registration_id: team.id,
      participant_id:  user.id,
      full_name:       fullName,
      email:           user.email!.toLowerCase(),
      is_leader:       false,
    })
    if (insertErr) return apiError(insertErr.message, 500)

    return apiSuccess({
      message:         `You joined ${team.team_name ?? 'the team'} for ${event?.title ?? 'the event'}`,
      registration_id: team.id,
      team_name:       team.team_name,
      event_name:      event?.title,
    })
  } catch (err) {
    console.error('[POST /api/participant/team/join]', err)
    return apiError('Internal server error', 500)
  }
}
