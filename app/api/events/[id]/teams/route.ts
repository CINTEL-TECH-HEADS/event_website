// app/api/events/[id]/teams/route.ts
// GET — Team Finder: open, non-full teams for an event that a participant can join.
// Returns team name, size, capacity, and member first names (for a join preview).

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { canAccessEvent, isExternalParticipant } from '@/lib/participants/identity'

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
      .select('max_team_size, open_to_external')
      .eq('id', eventId)
      .maybeSingle()

    // Students from other colleges don't see teams for SRM-only events.
    if (event && !canAccessEvent(await isExternalParticipant(admin, user?.id), event)) {
      return apiSuccess([])
    }

    const { data: teams } = await admin
      .from('registrations')
      .select('id, team_name, group_code, participant_id, payment_status, members:team_members(id, full_name, is_leader)')
      .eq('event_id', eventId)
      .eq('registration_type', 'team')
      .eq('status', 'confirmed')
      .eq('is_open', true)
      .order('registered_at', { ascending: false })

    const maxSize = event?.max_team_size ?? null
    // Show only the first name in the preview to keep it low-PII.
    const firstName = (full: string) => (full ?? '').trim().split(/\s+/)[0] || full
    const open = (teams ?? [])
      // Exclude the caller's own registration and any paid/locked teams.
      .filter((t: any) => (!user || t.participant_id !== user.id) && t.payment_status !== 'paid')
      .map((t: any) => ({
        registration_id: t.id,
        team_name: t.team_name,
        size: t.members?.length ?? 0,
        max_team_size: maxSize,
        members: (t.members ?? [])
          .slice()
          .sort((a: any, b: any) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0))
          .map((m: any) => firstName(m.full_name)),
      }))
      // Hide full teams from the finder.
      .filter((t) => maxSize === null || t.size < maxSize)

    return apiSuccess(open)
  } catch (err) {
    console.error('[GET /api/events/[id]/teams]', err)
    return apiError('Internal server error', 500)
  }
}
