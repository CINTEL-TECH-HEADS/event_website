// app/api/certificates/checked-in/route.ts
//
// GET /api/certificates/checked-in?event_id=<uuid>
//
// Returns checked-in registrations for the given event, grouped and enriched
// for the certificate management UI.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('event_id')

  if (!eventId) return apiError('event_id is required', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  // Fetch all attendance records for this event, joining the registration
  // and its team members. Attendance is registration-level (one row per
  // registration regardless of team size).
  const { data: attended, error } = await admin
    .from('attendance')
    .select(`
      registration_id,
      registrations!inner (
        id,
        registration_type,
        team_name,
        leader_name,
        leader_email,
        status,
        members:team_members (
          id,
          full_name,
          email,
          is_leader,
          checked_in_at
        )
      )
    `)
    .eq('event_id', eventId)

  if (error) return apiError(error.message, 500)

  const teams: {
    registrationId: string
    teamName: string
    members: { teamMemberId: string; name: string; email: string; isLeader: boolean }[]
  }[] = []

  const solos: {
    registrationId: string
    name: string
    email: string
  }[] = []

  for (const row of attended ?? []) {
    const reg = row.registrations as any
    if (!reg) continue
    // Only include confirmed registrations
    if (reg.status !== 'confirmed') continue

    if (reg.registration_type === 'team') {
      // Only members marked present at check-in get certificates.
      const rawMembers: any[] = (reg.members ?? []).filter((m: any) => m.checked_in_at)
      if (rawMembers.length === 0) continue

      // Sort: leader first, then alphabetical by name
      const sorted = [...rawMembers].sort((a, b) => {
        if (a.is_leader && !b.is_leader) return -1
        if (!a.is_leader && b.is_leader) return 1
        return (a.full_name ?? '').localeCompare(b.full_name ?? '')
      })

      teams.push({
        registrationId: reg.id,
        teamName: reg.team_name ?? 'Unnamed Team',
        members: sorted.map((m) => ({
          teamMemberId: m.id,
          name: m.full_name ?? '',
          email: m.email ?? '',
          isLeader: !!m.is_leader,
        })),
      })
    } else {
      solos.push({
        registrationId: reg.id,
        name: reg.leader_name ?? '',
        email: reg.leader_email ?? '',
      })
    }
  }

  // Sort teams alphabetically by team name
  teams.sort((a, b) => a.teamName.localeCompare(b.teamName))
  // Sort solos alphabetically by name
  solos.sort((a, b) => a.name.localeCompare(b.name))

  return apiSuccess({ teams, solos })
}
