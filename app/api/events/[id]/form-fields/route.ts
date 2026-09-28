// Owner: BE2
// GET  /api/events/[id]/form-fields — fetch form fields for an event (used by FE1 registration form)
// POST /api/events/[id]/form-fields — save/replace form fields for an event (used by FE2 form builder)
import { NextRequest } from 'next/server'
import {
  apiSuccess,
  apiError,
} from '@/lib/utils'

import {
  createAdminClient,
} from '@/lib/supabase/server'

import {
  formFieldsPayloadSchema,
} from '@/lib/validators/form-fields'

import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'
import { formLockMessage, getFormLock, type FormLock } from '@/lib/events/form-lock'

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  const { id } =
    await context.params

  const supabase =
    createAdminClient()

  const {
    data,
    error,
  } = await supabase
    .from('form_fields')
    .select('*')
    .eq('event_id', id)
    .order('sort_order', {
      ascending: true,
    })

  if (error)
    return apiError(
      error.message,
      500
    )

  return apiSuccess(
    data ?? []
  )
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  const { id } =
    await context.params

  // Only organizers may rewrite an event's form
  const auth = await requireOrganizerRole(id, ['owner', 'sub_admin'])
  if ('error' in auth) {
    return apiError(auth.error, auth.status)
  }

  const body =
    await req.json()

  const parsed =
    formFieldsPayloadSchema.safeParse(
      {
        event_id: id,
        fields:
          body.fields,
      }
    )

  if (!parsed.success) {
    return apiError(
      parsed.error.errors[0]
        .message
    )
  }

  const supabase =
    createAdminClient()

  // The form is fixed once the event is published or anyone has registered.
  const { data: event } = await supabase
    .from('events')
    .select('is_published')
    .eq('id', id)
    .maybeSingle()
  let lock: FormLock
  try {
    lock = await getFormLock(supabase, id, event?.is_published)
  } catch {
    return apiError('Could not check the event. Try again.', 500)
  }
  if (lock) return apiError(formLockMessage(lock), 409)

  const { error: deleteError } = await supabase
    .from('form_fields')
    .delete()
    .eq('event_id', id)

  if (deleteError)
    return apiError(
      deleteError.message,
      500
    )

  const rows =
    parsed.data.fields.map(
      (f, i) => ({
        ...f,
        event_id: id,
        sort_order: i,
      })
    )

  const { error } =
    await supabase
      .from('form_fields')
      .insert(rows as any)

  if (error)
    return apiError(
      error.message,
      500
    )

  await logAction({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: 'form_fields.update',
    targetType: 'event',
    targetId: id,
    eventId: id,
    metadata: { count: rows.length },
  })

  const { data } =
    await supabase
      .from('form_fields')
      .select('*')
      .eq('event_id', id)
      .order('sort_order', {
        ascending: true,
      })

  return apiSuccess(
    data ?? []
  )
}