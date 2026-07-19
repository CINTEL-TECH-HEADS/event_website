// app/api/events/[id]/teams/route.ts
// GET — Team Finder: open, non-full teams for an event that a participant can join.
// Returns no PII (no emails/names) — just team name, size and capacity.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const user = await getAuthUser()
    const admin = createAdminClient()

    const { data: event } = await admin
      .from('events')
      .select('max_team_size')
      .eq('id', eventId)
      .maybeSingle()

    const { data: teams } = await admin
      .from('registrations')
      .select('id, team_name, group_code, participant_id, members:team_members(id)')
      .eq('event_id', eventId)
      .eq('registration_type', 'team')
      .eq('status', 'confirmed')
      .eq('is_open', true)
      .order('registered_at', { ascending: false })

    const maxSize = event?.max_team_size ?? null
    const open = (teams ?? [])
      // Exclude the caller's own registration (their seeker/team).
      .filter((t: any) => !user || t.participant_id !== user.id)
      .map((t: any) => ({
        registration_id: t.id,
        team_name: t.team_name,
        size: t.members?.length ?? 0,
        max_team_size: maxSize,
      }))
      // Hide full teams from the finder.
      .filter((t) => maxSize === null || t.size < maxSize)

    return apiSuccess(open)
  } catch (err) {
    console.error('[GET /api/events/[id]/teams]', err)
    return apiError('Internal server error', 500)
  }
}
