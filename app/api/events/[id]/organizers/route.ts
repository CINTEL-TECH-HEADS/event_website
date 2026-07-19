// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

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
          role,
          profiles(
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', id)

    if (error)
      return apiError(
        error.message,
        500
      )

    return apiSuccess(
      data ?? []
    )
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}

export async function POST(
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

    // Only the event owner can add organizers
    const auth = await requireOrganizerRole(id, ['owner'])
    if ('error' in auth) {
      return apiError(auth.error, auth.status)
    }

    const body =
      await req.json()

    const supabase =
      createAdminClient()

    const { data, error } =
      await supabase
        .from(
          'event_organizers'
        )
        .insert([
          {
            event_id: id,
            profile_id:
              body.profile_id,
            role:
              body.role ??
              'manager',
          },
        ])
        .select()
        .single()

    if (error)
      return apiError(
        error.message,
        500
      )

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'organizer.add',
      targetType: 'organizer',
      targetId: body.profile_id,
      eventId: id,
      metadata: { role: body.role ?? 'manager' },
    })

    return apiSuccess(data)
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}