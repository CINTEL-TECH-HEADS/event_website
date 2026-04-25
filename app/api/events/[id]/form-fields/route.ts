// Owner: BE2
// GET  /api/events/[id]/form-fields — fetch form fields for an event (used by FE1 registration form)
// POST /api/events/[id]/form-fields — save/replace form fields for an event (used by FE2 form builder)
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { formFieldsPayloadSchema } from '@/lib/validators/form-fields'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('event_id', params.id)
    .order('sort_order', { ascending: true })

  if (error) return apiError(error.message, 500)
  return apiSuccess(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO BE2: Validate organizer owns this event before allowing field changes
  const body = await req.json()
  const parsed = formFieldsPayloadSchema.safeParse({ event_id: params.id, fields: body.fields })
  if (!parsed.success) return apiError(parsed.error.errors[0].message)

  const supabase = createAdminClient()

  // Replace all fields for this event (delete + re-insert to handle reordering cleanly)
  await supabase.from('form_fields').delete().eq('event_id', params.id)

  const rows = parsed.data.fields.map((f, i) => ({
    ...f,
    event_id: params.id,
    sort_order: i,
  }))

  const { error } = await supabase.from('form_fields').insert(rows)
  if (error) return apiError(error.message, 500)

  return apiSuccess({ message: `${rows.length} fields saved` })
}
