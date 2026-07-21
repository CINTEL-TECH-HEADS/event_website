// app/api/uploads/file/route.ts
// POST — upload a file/image answer for a custom form field (auth required).
//   Accepts documents (pdf/ppt/pptx) and images (png/jpg/jpeg/webp).
//   Returns { path, url, kind }. Store `path` as the field answer.
// GET  ?path=… — return a fresh signed URL for a stored path (for viewing).

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp']
const DOC_EXT = ['pdf', 'ppt', 'pptx']
const MAX_IMAGE = 5 * 1024 * 1024
const MAX_DOC = 20 * 1024 * 1024
const BUCKET = 'uploads'

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
    contentType: file.type || undefined,
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
  if (!path || !path.startsWith('submissions/')) return apiError('Invalid path', 400)

  const admin = createAdminClient()
  const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error || !signed) return apiError('Could not sign file', 404)

  const ext = (path.split('.').pop() ?? '').toLowerCase()
  return apiSuccess({ url: signed.signedUrl, kind: IMAGE_EXT.includes(ext) ? 'image' : 'file' })
}
