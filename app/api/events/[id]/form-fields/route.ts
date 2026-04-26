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

  await supabase
    .from('form_fields')
    .delete()
    .eq('event_id', id)

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