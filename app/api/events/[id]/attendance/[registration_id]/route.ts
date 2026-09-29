// PUT /api/events/[id]/attendance/[registration_id] — edit attendance from the
// check-in list. Body: { present: boolean } for a solo registration, or
// { member_ids: string[] } (the members who are present) for a team.
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { setAttendance } from '@/lib/attendance/set'
import { z } from 'zod'

const bodySchema = z.object({
  present: z.boolean().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; registration_id: string }> }
) {
  try {
    const { id: eventId, registration_id } = await params

    const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400)

    const result = await setAttendance(createAdminClient(), {
      eventId,
      registrationId: registration_id,
      present: parsed.data.present,
      memberIds: parsed.data.member_ids,
      method: 'manual',
      actor: auth.user,
    })
    if ('error' in result) return apiError(result.error, result.status)

    return apiSuccess(result.state)
  } catch (err) {
    console.error('[PUT /api/events/[id]/attendance/[registration_id]]', err)
    return apiError('Internal server error', 500)
  }
}
