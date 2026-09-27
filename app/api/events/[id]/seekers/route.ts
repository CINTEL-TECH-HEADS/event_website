// app/api/events/[id]/seekers/route.ts
// GET — individual seekers for a team event: open team-of-one registrations that
// a team short of members can invite. Includes each seeker's networking profile
// (skills/interests/links/email) so teams can review + contact before inviting.

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

    // Students from other colleges don't see seekers for SRM-only events.
    const { data: event } = await admin
      .from('events')
      .select('open_to_external')
      .eq('id', eventId)
      .maybeSingle()
    if (event && !canAccessEvent(await isExternalParticipant(admin, user?.id), event)) {
      return apiSuccess([])
    }

    const { data: regs } = await admin
      .from('registrations')
      .select('id, participant_id, members:team_members(id, full_name, is_leader)')
      .eq('event_id', eventId)
      .eq('registration_type', 'team')
      .eq('status', 'confirmed')
      .eq('is_open', true)
      .order('registered_at', { ascending: false })

    // A seeker is an open team-of-one; surface the person (the sole member).
    const openSolo = (regs ?? [])
      .filter((r: any) => (r.members?.length ?? 0) === 1)
      .filter((r: any) => !user || r.participant_id !== user.id)

    // Attach each seeker's networking profile.
    const ids = openSolo.map((r: any) => r.participant_id).filter(Boolean)
    const { data: profiles } = ids.length
      ? await admin
          .from('participant_profiles')
          .select('id, full_name, department, year_of_study, skills, interests, linkedin_url, github_url, college_email, personal_email')
          .in('id', ids)
      : { data: [] as any[] }
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]))

    const seekers = openSolo.map((r: any) => {
      const p = byId.get(r.participant_id) ?? {}
      return {
        registration_id: r.id,
        participant_id: r.participant_id,
        name: p.full_name || r.members?.[0]?.full_name || 'Participant',
        department: p.department ?? null,
        year_of_study: p.year_of_study ?? null,
        skills: p.skills ?? null,
        interests: p.interests ?? null,
        linkedin_url: p.linkedin_url ?? null,
        github_url: p.github_url ?? null,
        email: p.college_email || p.personal_email || null,
      }
    })

    return apiSuccess(seekers)
  } catch (err) {
    console.error('[GET /api/events/[id]/seekers]', err)
    return apiError('Internal server error', 500)
  }
}
