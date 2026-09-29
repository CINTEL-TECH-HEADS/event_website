// app/api/certificates/templates/route.ts
//
// GET  /api/certificates/templates?event_id=<uuid>
//   → returns all templates for the event (one per certificate_type)
//
// POST /api/certificates/templates  (multipart/form-data)
//   → uploads an image template and upserts a certificate_templates row
//   Fields: event_id, certificate_type, name, file (PNG/JPG/JPEG)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

const VALID_CERT_TYPES = [
  'Participation',
  'Winner',
  'Runner Up',
  '2nd Runner Up',
]

const VALID_TEMPLATE_TYPES = ['solo', 'team']

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg']

// A legacy UNIQUE constraint `certificate_templates_event_template_type_key`
// on (event_id, template_type) is still present in the live Supabase database.
// It allows only ONE row per template_type slot, which breaks the 8-slot
// (4 certificate types × 2 template types) system. Migration 021 drops it.
//
// WORKAROUND: PostgreSQL UNIQUE constraints treat NULLs as distinct values,
// so storing template_type = NULL allows all 8 rows to coexist even with the
// legacy constraint present. The true solo/team type is derived from the
// storage_path (which contains the template type as a path segment).

const LEGACY_CONSTRAINT = 'certificate_templates_event_template_type_key'

// Extract the template type (solo/team) from the storage_path.
// Path format: certificate-templates/{eventId}/{templateType}/{certType}.ext
function deriveTemplateTypeFromPath(storagePath: string): string | null {
  const parts = storagePath.split('/')
  // parts[0]='certificate-templates', parts[1]=eventId, parts[2]=templateType
  if (parts.length >= 3 && (parts[2] === 'solo' || parts[2] === 'team')) {
    return parts[2]
  }
  return null
}

// Best-effort removal of a just-uploaded storage file if the DB write fails,
// so no orphaned object is left behind.
async function removeUploadedFile(
  admin: ReturnType<typeof createAdminClient>,
  storagePath: string
) {
  try {
    await admin.storage.from('uploads').remove([storagePath])
  } catch {
    // Non-fatal — ignore cleanup errors
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('event_id')

  if (!eventId) return apiError('event_id is required', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('certificate_templates')
    .select('id, event_id, name, storage_path, certificate_type, layout_config, is_default, template_type, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return apiError(error.message, 500)

// Generate a short-lived signed URL for each template so the editor can
  // display a preview. 60-minute expiry — enough for an editing session.
  //
  // Also derive template_type from storage_path for rows stored as NULL
  // (workaround for the legacy UNIQUE constraint).
  const templates = await Promise.all(
    (data ?? []).map(async (t) => {
      let previewUrl: string | null = null
      if (t.storage_path) {
        const { data: signed } = await admin.storage
          .from('uploads')
          .createSignedUrl(t.storage_path, 60 * 60)
        previewUrl = signed?.signedUrl ?? null
      }
      // Derive template_type from storage_path if it's NULL in DB
      const derivedType = t.template_type ?? deriveTemplateTypeFromPath(t.storage_path ?? '')
      return { ...t, template_type: derivedType, previewUrl }
    })
  )

  return apiSuccess(templates)
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return apiError('Expected multipart/form-data', 400)
    }

    const formData = await req.formData()
    const eventId = formData.get('event_id') as string | null
    const certificateType = formData.get('certificate_type') as string | null
    const templateType = formData.get('template_type') as string | null
    const name = formData.get('name') as string | null
    const file = formData.get('file') as File | null

    if (!eventId || !certificateType || !templateType || !file) {
      return apiError('Missing event_id, certificate_type, template_type, or file', 400)
    }

    if (!VALID_CERT_TYPES.includes(certificateType)) {
      return apiError(`Invalid certificate_type. Must be one of: ${VALID_CERT_TYPES.join(', ')}`, 400)
    }

    if (!VALID_TEMPLATE_TYPES.includes(templateType)) {
      return apiError(`Invalid template_type. Must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`, 400)
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return apiError('Template must be a PNG, JPG or JPEG image', 400)
    }

    const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    const admin = createAdminClient()

    // Determine file extension
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const storagePath = `certificate-templates/${eventId}/${templateType}/${certificateType.replace(/ /g, '_')}.${ext}`

    // Upload to Supabase Storage (upsert)
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) return apiError(`Storage upload failed: ${uploadError.message}`, 500)

// WORKAROUND: Store template_type = NULL in the DB to bypass the legacy
    // UNIQUE constraint on (event_id, template_type). PostgreSQL UNIQUE
    // constraints treat NULLs as distinct, so multiple rows with NULL
    // template_type can coexist. The true solo/team type is derived from
    // the storage_path path segment.
    const { data: existing } = await admin
      .from('certificate_templates')
      .select('id')
      .eq('event_id', eventId)
      .eq('certificate_type', certificateType)
      // template_type is NULL in DB — match by storage_path prefix instead
      .filter('storage_path', 'like', `certificate-templates/${eventId}/${templateType}/%`)
      .maybeSingle()

    let templateRow: any

    if (existing) {
      const { data, error } = await admin
        .from('certificate_templates')
        .update({
          name: name ?? `${templateType === 'solo' ? 'Solo' : 'Team'} ${certificateType}`,
          storage_path: storagePath,
          template_type: templateType,
          certificate_type: certificateType,
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return apiError(error.message, 500)
      templateRow = data
    } else {
      const { data, error } = await admin
        .from('certificate_templates')
        .insert({
          event_id: eventId,
          certificate_type: certificateType,
          template_type: templateType,
          name: name ?? `${templateType === 'solo' ? 'Solo' : 'Team'} ${certificateType}`,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (error) {
        // If legacy constraint on (event_id, template_type) exists in DB, fallback to insert with template_type: null
        const { data: fbData, error: fbError } = await admin
          .from('certificate_templates')
          .insert({
            event_id: eventId,
            certificate_type: certificateType,
            template_type: null,
            name: name ?? `${templateType === 'solo' ? 'Solo' : 'Team'} ${certificateType}`,
            storage_path: storagePath,
          })
          .select()
          .single()

        if (fbError) return apiError(fbError.message, 500)
        templateRow = fbData
      } else {
        templateRow = data
      }
    }

    // Derive the template_type from the storage_path for the response
    templateRow = { ...templateRow, template_type: deriveTemplateTypeFromPath(storagePath) }

    // Return with a fresh signed URL for the editor preview
    const { data: signed } = await admin.storage
      .from('uploads')
      .createSignedUrl(storagePath, 60 * 60)

    return apiSuccess({ ...templateRow, previewUrl: signed?.signedUrl ?? null })
  } catch (err: any) {
    console.error('[POST /api/certificates/templates]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}
