// Owner: BE2
// GET /api/events/[id]/organizers — who has access to this event, and the
// viewer's own role on it.
// Adding people goes through POST /api/organizers (looks them up by email).
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const { id } =
      await context.params

    // Organizer list exposes emails — organizers/judges only
    const auth = await requireOrganizerRole(id, ['owner', 'sub_admin', 'judge'])
    if ('error' in auth) {
      return apiError(auth.error, auth.status)
    }

    const supabase =
      createAdminClient()

    const { data, error } =
      await supabase
        .from(
          'event_organizers'
        )
        .select(`
          id,
          role,
          profile_id,
          profile:profiles(
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true })

    if (error)
      return apiError(
        error.message,
        500
      )

    // viewer_role lets the screen show add/remove only to owners (club
    // organizers count as owner for every event).
    return apiSuccess({
      organizers: data ?? [],
      viewer_role: auth.organizerRole,
    })
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}
