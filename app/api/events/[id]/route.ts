import { NextRequest } from 'next/server'
import {
  apiSuccess,
  apiError,
} from '@/lib/utils'

import {
  createAdminClient,
} from '@/lib/supabase/server'

import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

function isUUID(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

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

    const supabase =
      createAdminClient()

    let query =
      supabase
        .from('events')
        .select('*')

    query = isUUID(id)
      ? query.eq(
          'id',
          id
        )
      : query.eq(
          'slug',
          id
        )

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error)
      return apiError(
        error.message,
        500
      )

    if (!data)
      return apiError(
        'Event not found',
        404
      )

    return apiSuccess(
      data
    )
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}

export async function PATCH(
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

    // Only the event owner or a sub_admin can edit an event
    const auth = await requireOrganizerRole(id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return apiError(auth.error, auth.status)
    }

    const body =
      await req.json()

    const supabase =
      createAdminClient()

    const {
      data,
      error,
    } =
      await (supabase
  .from('events') as any)
  .update(body)
        .eq('id', id)
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
      action: 'event.update',
      targetType: 'event',
      targetId: id,
      eventId: id,
      metadata: { fields: Object.keys(body ?? {}) },
    })

    return apiSuccess(
      data
    )
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}

export async function DELETE(
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

    // Only the event owner can delete an event
    const auth = await requireOrganizerRole(id, ['owner'])
    if ('error' in auth) {
      return apiError(auth.error, auth.status)
    }

    const supabase =
      createAdminClient()

    const {
      error,
    } =
      await (supabase
  .from('events') as any)
  .update({
  is_deleted: true,
} as any)
        .eq('id', id)

    if (error)
      return apiError(
        error.message,
        500
      )

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'event.delete',
      targetType: 'event',
      targetId: id,
      eventId: id,
    })

    return apiSuccess({
      message:
        'Event deleted',
    })
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}