// app/api/certificates/templates/route.ts
// Named certificate templates per event.
//   GET    ?event_id=  → list templates
//   POST   (multipart: file, event_id, name) → upload a named PDF template
//   DELETE (json: { id, event_id }) → remove a template

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return apiError('event_id is required', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()
  const { data } = await admin
    .from('certificate_templates')
    .select('id, name, is_default, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
  return apiSuccess(data ?? [])
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file') as File | null
  const eventId = form?.get('event_id') as string | null
  const name = ((form?.get('name') as string | null) ?? '').trim()

  if (!file || !eventId || !name) return apiError('file, event_id and name are required', 400)
  if (file.type !== 'application/pdf') return apiError('Template must be a PDF', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()
  const templateId = crypto.randomUUID()
  const path = `templates/${eventId}/${templateId}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await admin.storage.from('uploads').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (upErr) return apiError(upErr.message, 500)

  // First template for the event becomes the default.
  const { count } = await admin
    .from('certificate_templates')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  const { data, error } = await admin
    .from('certificate_templates')
    .insert({ id: templateId, event_id: eventId, name, storage_path: path, is_default: (count ?? 0) === 0 })
    .select('id, name, is_default, created_at')
    .single()
  if (error) return apiError(error.message, 500)
  return apiSuccess(data)
}

export async function DELETE(req: NextRequest) {
  const { id, event_id } = await req.json().catch(() => ({}))
  if (!id || !event_id) return apiError('id and event_id are required', 400)

  const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()
  const { data: tpl } = await admin
    .from('certificate_templates')
    .select('storage_path')
    .eq('id', id)
    .eq('event_id', event_id)
    .maybeSingle()
  if (tpl?.storage_path) await admin.storage.from('uploads').remove([tpl.storage_path]).catch(() => {})
  await admin.from('certificate_templates').delete().eq('id', id).eq('event_id', event_id)
  return apiSuccess({ deleted: true })
}
