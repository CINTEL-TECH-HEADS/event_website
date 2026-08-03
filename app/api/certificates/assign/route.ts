// app/api/certificates/assign/route.ts
// POST — assign a template to attendees.
// Body: { event_id, template_id, targets: [{ registration_id, team_member_id? }] }

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return apiError('event_id is required', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()
  const { data } = await admin
    .from('certificate_assignments')
    .select('registration_id, team_member_id, template_id')
    .eq('event_id', eventId)
  return apiSuccess(data ?? [])
}

export async function POST(req: NextRequest) {
  const { event_id, template_id, targets } = await req.json().catch(() => ({}))
  if (!event_id || !template_id || !Array.isArray(targets)) {
    return apiError('event_id, template_id and targets are required', 400)
  }

  const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  for (const t of targets) {
    if (!t.registration_id) continue
    // Remove any existing assignment for this attendee, then insert the new one.
    let del = admin
      .from('certificate_assignments')
      .delete()
      .eq('registration_id', t.registration_id)
    del = t.team_member_id ? del.eq('team_member_id', t.team_member_id) : del.is('team_member_id', null)
    await del

    await admin.from('certificate_assignments').insert({
      event_id,
      registration_id: t.registration_id,
      team_member_id: t.team_member_id ?? null,
      template_id,
    })
  }

  return apiSuccess({ assigned: targets.length })
}
