// app/api/certificates/templates/[templateId]/route.ts
//
// PATCH /api/certificates/templates/[templateId]
//   → update layout_config (and optionally name)
//
// DELETE /api/certificates/templates/[templateId]
//   → remove template record (and optionally its storage file)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const body = await req.json()
    const { layout_config, name } = body

    // Fetch template to get its event_id for auth check
    const admin = createAdminClient()
    const { data: tmpl, error: fetchErr } = await admin
      .from('certificate_templates')
      .select('event_id')
      .eq('id', templateId)
      .single()

    if (fetchErr || !tmpl) return apiError('Template not found', 404)

    const auth = await requireOrganizerRole(tmpl.event_id, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    const updates: Record<string, unknown> = {}
    if (layout_config !== undefined) updates.layout_config = layout_config
    if (name !== undefined) updates.name = name

    if (Object.keys(updates).length === 0) return apiError('Nothing to update', 400)

    const { data, error } = await admin
      .from('certificate_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single()

    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err: any) {
    console.error('[PATCH /api/certificates/templates/[templateId]]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params
    const admin = createAdminClient()

    const { data: tmpl, error: fetchErr } = await admin
      .from('certificate_templates')
      .select('event_id, storage_path')
      .eq('id', templateId)
      .single()

    if (fetchErr || !tmpl) return apiError('Template not found', 404)

    const auth = await requireOrganizerRole(tmpl.event_id, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    // Remove from storage (best-effort, non-fatal)
    if (tmpl.storage_path) {
      await admin.storage.from('uploads').remove([tmpl.storage_path])
    }

    const { error } = await admin
      .from('certificate_templates')
      .delete()
      .eq('id', templateId)

    if (error) return apiError(error.message, 500)
    return apiSuccess({ deleted: true })
  } catch (err: any) {
    console.error('[DELETE /api/certificates/templates/[templateId]]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}
