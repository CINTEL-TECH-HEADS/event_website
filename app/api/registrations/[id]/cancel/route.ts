// Owner: BE2
// POST /api/registrations/[id]/cancel — cancel registration + trigger waitlist promotion

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminClient()
  const { id } = await params


  const table: any = supabase.from('registrations')

  const { data: registration, error: fetchError } = await table
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !registration) {
    return apiError('Registration not found', 404)
  }

  // Only an organizer of this registration's event may cancel it
  const auth = await requireOrganizerRole(registration.event_id, ['owner', 'sub_admin'])
  if ('error' in auth) {
    return apiError(auth.error, auth.status)
  }


  const { error: cancelError } = await table
    .update({
      status: 'cancelled',
    })
    .eq('id', id)

  if (cancelError) {
    return apiError(cancelError.message, 500)
  }

  // Cancelling only frees the spot — the organizer offers it to a waitlisted
  // participant from the portal (they then accept + pay). No silent auto-promote.
  await logAction({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: 'registration.cancel',
    targetType: 'registration',
    targetId: id,
    eventId: registration.event_id,
  })

  return apiSuccess({ message: 'Registration cancelled' })
}