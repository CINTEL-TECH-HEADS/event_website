// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

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