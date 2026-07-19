// app/api/participant/team/invites/route.ts
// GET — the caller's pending matches, categorized as incoming (needs my response)
// or outgoing. Covers both roles: seeker and team creator.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorised', 401)

    const admin = createAdminClient()

    // Team registrations I created (to catch requests to my team / invites I sent).
    const { data: myTeams } = await admin
      .from('registrations')
      .select('id')
      .eq('participant_id', user.id)
      .eq('registration_type', 'team')
    const myTeamIds = (myTeams ?? []).map((t: any) => t.id)

    const orClauses = [`seeker_participant_id.eq.${user.id}`]
    if (myTeamIds.length) orClauses.push(`team_registration_id.in.(${myTeamIds.join(',')})`)

    const { data: invites } = await admin
      .from('team_invites')
      .select(`
        id, direction, status, event_id, team_registration_id, seeker_participant_id, created_at,
        team:registrations!team_invites_team_registration_id_fkey(team_name),
        seeker_reg:registrations!team_invites_seeker_registration_id_fkey(members:team_members(full_name, participant_id)),
        event:events(title)
      `)
      .eq('status', 'pending')
      .or(orClauses.join(','))
      .order('created_at', { ascending: false })

    const rows = (invites ?? [])
      .map((iv: any) => {
        // The seeker's display name: their own member row.
        const members = iv.seeker_reg?.members ?? []
        const sm = members.find((m: any) => m?.participant_id === iv.seeker_participant_id) ?? members[0]
        const iAmSeeker = iv.seeker_participant_id === user.id
        const iAmTeam = myTeamIds.includes(iv.team_registration_id)
        // Incoming = the party who must respond.
        const incoming = iv.direction === 'invite' ? iAmSeeker : iAmTeam
        return {
          id: iv.id,
          direction: iv.direction,
          incoming,
          event_title: iv.event?.title ?? null,
          team_registration_id: iv.team_registration_id,
          team_name: iv.team?.team_name ?? null,
          seeker_name: sm?.full_name ?? 'Participant',
        }
      })

    return apiSuccess(rows)
  } catch (err) {
    console.error('[GET /api/participant/team/invites]', err)
    return apiError('Internal server error', 500)
  }
}
