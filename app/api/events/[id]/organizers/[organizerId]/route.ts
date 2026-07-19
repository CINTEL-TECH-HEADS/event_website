// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
      organizerId: string
    }>
  }
) {
  try {
    const { id, organizerId } =
      await context.params

    // Only the event owner can remove organizers
    const auth = await requireOrganizerRole(id, ['owner'])
    if ('error' in auth) {
      return apiError(auth.error, auth.status)
    }

    const supabase =
      createAdminClient()

    const { error } =
      await supabase
        .from(
          'event_organizers'
        )
        .delete()
        .eq('event_id', id)
        .eq(
          'profile_id',
          organizerId
        )

    if (error)
      return apiError(
        error.message,
        500
      )

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'organizer.remove',
      targetType: 'organizer',
      targetId: organizerId,
      eventId: id,
    })

    return apiSuccess({
      message:
        'Organizer removed',
    })
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}