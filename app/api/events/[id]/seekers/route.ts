// app/api/events/[id]/seekers/route.ts
// GET — individual seekers for a team event: open team-of-one registrations that
// a team short of members can invite. Excludes the caller's own registration.
// No PII beyond a display name.

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

    const { data: regs } = await admin
      .from('registrations')
      .select('id, participant_id, members:team_members(id, full_name, is_leader)')
      .eq('event_id', eventId)
      .eq('registration_type', 'team')
      .eq('status', 'confirmed')
      .eq('is_open', true)
      .order('registered_at', { ascending: false })

    // A seeker is an open team-of-one; surface the person (the sole member).
    const seekers = (regs ?? [])
      .filter((r: any) => (r.members?.length ?? 0) === 1)
      .filter((r: any) => !user || r.participant_id !== user.id)
      .map((r: any) => ({
        registration_id: r.id,
        participant_id: r.participant_id,
        name: r.members?.[0]?.full_name ?? 'Participant',
      }))

    return apiSuccess(seekers)
  } catch (err) {
    console.error('[GET /api/events/[id]/seekers]', err)
    return apiError('Internal server error', 500)
  }
}
