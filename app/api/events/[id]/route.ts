import { NextRequest } from 'next/server'
import {
  apiSuccess,
  apiError,
} from '@/lib/utils'

import {
  createAdminClient,
} from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { canAccessEvent, isExternalParticipant } from '@/lib/participants/identity'

import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'
import { formLockMessage, getFormLock } from '@/lib/events/form-lock'
import { eventBaseSchema } from '@/lib/validators/event'

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
        // Include the event's configured form fields so the registration page
        // renders exactly what the organizer added.
        .select('*, form_fields(*)')

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

    // Order fields by sort_order for a stable form layout.
    if (data?.form_fields) {
      data.form_fields.sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    }

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

    // SRM-only events don't exist, as far as students from other colleges are
    // concerned. (Organizers are never external, so the dashboard is unaffected.)
    const viewer = await getAuthUser()
    if (!canAccessEvent(await isExternalParticipant(supabase, viewer?.id), data))
      return apiError(
        'Event not found',
        404
      )

    // Whether the dashboard may still edit the registration form.
    const form_lock = await getFormLock(supabase, data.id, data.is_published)
      .catch(() => 'registrations' as const)

    return apiSuccess(
      { ...data, form_lock }
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

    const { data: current } = await supabase
      .from('events')
      .select('is_published, open_to_external, starts_at, ends_at, registration_closes_at')
      .eq('id', id)
      .maybeSingle()

    // Where/when edits: same rules as creating an event, checked against the
    // event's current times for any that aren't being changed.
    const whereWhen = eventBaseSchema
      .pick({ venue: true, event_type: true, starts_at: true, ends_at: true, registration_closes_at: true })
      .partial()
      .safeParse(body)
    if (!whereWhen.success) return apiError(whereWhen.error.errors[0].message, 400)
    if ('starts_at' in body || 'ends_at' in body || 'registration_closes_at' in body) {
      const startsAt = new Date(body.starts_at ?? current?.starts_at)
      const endsAt = new Date(body.ends_at ?? current?.ends_at)
      const closesAt = new Date(body.registration_closes_at ?? current?.registration_closes_at)
      if (endsAt <= startsAt) return apiError('End time must be after start time', 400)
      if (closesAt > startsAt) return apiError('Registration must close before the event starts', 400)
    }

    // Who can register decides which forms exist, so it is locked with the
    // form: while published, and once anyone has registered.
    if (
      typeof body.open_to_external === 'boolean' &&
      body.open_to_external !== (current?.open_to_external === true)
    ) {
      const lock = await getFormLock(supabase, id, current?.is_published)
      if (lock) return apiError(formLockMessage(lock, 'audience'), 409)
    }

    // Gate publishing: an event must have a registration form. Events open to
    // other colleges have two forms (SRM KTR / other colleges) and need a field
    // in each.
    const willBeOpen = body.open_to_external ?? current?.open_to_external ?? false
    if (body.is_published === true) {
      const { data: fields } = await supabase
        .from('form_fields')
        .select('audience')
        .eq('event_id', id)
      const external = (fields ?? []).filter((f: any) => f.audience === 'external').length
      const srm = (fields ?? []).length - external
      if (srm + external === 0) {
        return apiError('Add at least one registration field before publishing this event.', 400)
      }
      if (willBeOpen && srm === 0) {
        return apiError('Add at least one field to the SRM KTR form before publishing this event.', 400)
      }
      if (willBeOpen && external === 0) {
        return apiError('Add at least one field to the other-college form before publishing this event.', 400)
      }
    }

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

    const form_lock = await getFormLock(supabase, id, data.is_published)
      .catch(() => 'registrations' as const)

    return apiSuccess(
      { ...data, form_lock }
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