// app/api/uploads/file/route.ts
// POST — upload a file/image answer for a custom form field (auth required).
//   Accepts documents (pdf/ppt/pptx) and images (png/jpg/jpeg/webp).
//   Returns { path, url, kind }. Store `path` as the field answer.
// GET  ?path=… — return a fresh signed URL for a stored path (for viewing), to
//   the person who uploaded it, or to organizers/judges of the event it was
//   submitted to (as a form answer or a payment screenshot).

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser, requireOrganizerRole } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp']
const DOC_EXT = ['pdf', 'ppt', 'pptx']
const MAX_IMAGE = 5 * 1024 * 1024
const MAX_DOC = 20 * 1024 * 1024
const BUCKET = 'uploads'

// Stored content type comes from the (checked) extension, not the browser.
const CONTENT_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return apiError('Please sign in to upload.', 401)

  const form = await req.formData().catch(() => null)
  const file = form?.get('file') as File | null
  if (!file) return apiError('No file provided', 400)

  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  const isImage = IMAGE_EXT.includes(ext)
  const isDoc = DOC_EXT.includes(ext)
  if (!isImage && !isDoc) {
    return apiError('Unsupported file type. Allowed: images (png/jpg/webp) or documents (pdf/ppt/pptx).')
  }
  if (file.size > (isImage ? MAX_IMAGE : MAX_DOC)) {
    return apiError(`File too large. Max ${isImage ? '5MB (images)' : '20MB (documents)'}.`)
  }

  const admin = createAdminClient()
  const path = `submissions/${user.id}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: CONTENT_TYPE[ext],
    upsert: false,
  })
  if (error) return apiError(error.message, 500)

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  return apiSuccess({ path, url: signed?.signedUrl ?? null, kind: isImage ? 'image' : 'file' })
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return apiError('Unauthorised', 401)

  const path = req.nextUrl.searchParams.get('path')
  if (!path || !path.startsWith('submissions/') || path.includes('..')) return apiError('Invalid path', 400)

  const admin = createAdminClient()

  // Your own upload, or a file submitted to an event you organize or judge.
  if (!path.startsWith(`submissions/${user.id}/`)) {
    const [{ data: answers }, { data: payments }] = await Promise.all([
      admin.from('registration_answers').select('registrations(event_id)').eq('answer', path).limit(20),
      admin.from('payment_submissions').select('event_id').eq('screenshot_path', path).limit(20),
    ])
    const eventIds = new Set<string>([
      ...(answers ?? []).map((a: any) => a.registrations?.event_id).filter(Boolean),
      ...(payments ?? []).map((p: any) => p.event_id).filter(Boolean),
    ])
    let allowed = false
    for (const eventId of eventIds) {
      const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
      if (!('error' in auth)) { allowed = true; break }
    }
    // Same answer as a missing file, so paths can't be probed.
    if (!allowed) return apiError('Could not sign file', 404)
  }
  const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error || !signed) return apiError('Could not sign file', 404)

  const ext = (path.split('.').pop() ?? '').toLowerCase()
  return apiSuccess({ url: signed.signedUrl, kind: IMAGE_EXT.includes(ext) ? 'image' : 'file' })
}
