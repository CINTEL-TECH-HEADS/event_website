// app/api/events/[id]/banner/route.ts
// The event's poster, shown on the home page, the events page and the event page.
//   POST   (multipart: file) → upload / replace the poster
//   DELETE                   → remove it
// Posters live in the public `banners` bucket; events.banner_url is its public URL.
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

const BUCKET = 'banners'
const MAX_BYTES = 5 * 1024 * 1024
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// The storage path of a poster we uploaded, from its public URL.
function storagePath(url: string | null | undefined): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const at = url?.indexOf(marker) ?? -1
  return url && at >= 0 ? decodeURIComponent(url.slice(at + marker.length)) : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireOrganizerRole(id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return apiError('Choose an image to upload.', 400)
  const ext = TYPES[file.type]
  if (!ext) return apiError('The poster must be a JPG, PNG or WebP image.', 400)
  if (file.size > MAX_BYTES) return apiError('The poster must be 5 MB or smaller.', 400)

  const admin = createAdminClient()
  const { data: event } = await admin.from('events').select('banner_url').eq('id', id).maybeSingle()
  if (!event) return apiError('Event not found', 404)

  const path = `events/${id}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type })
  if (upErr) return apiError(upErr.message, 500)

  const url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: updErr } = await admin.from('events').update({ banner_url: url }).eq('id', id)
  if (updErr) {
    await admin.storage.from(BUCKET).remove([path]).catch(() => {})
    return apiError(updErr.message, 500)
  }

  // Replaced: remove the old file (best effort).
  const old = storagePath(event.banner_url)
  if (old) await admin.storage.from(BUCKET).remove([old]).catch(() => {})

  await logAction({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: 'event.poster',
    targetType: 'event',
    targetId: id,
    eventId: id,
    metadata: { replaced: !!event.banner_url },
  })

  return apiSuccess({ banner_url: url })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireOrganizerRole(id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()
  const { data: event } = await admin.from('events').select('banner_url').eq('id', id).maybeSingle()
  if (!event) return apiError('Event not found', 404)

  const { error } = await admin.from('events').update({ banner_url: null }).eq('id', id)
  if (error) return apiError(error.message, 500)

  const old = storagePath(event.banner_url)
  if (old) await admin.storage.from(BUCKET).remove([old]).catch(() => {})

  await logAction({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: 'event.poster_remove',
    targetType: 'event',
    targetId: id,
    eventId: id,
  })

  return apiSuccess({ banner_url: null })
}
