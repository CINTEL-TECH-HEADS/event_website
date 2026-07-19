// Owner: BE2
// POST /api/waitlist — internal route: promote next waitlisted registration
// Called by /api/registrations/[id]/cancel — not called directly by frontend
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { formatEventDate } from '@/lib/utils'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function POST(req: NextRequest) {
  const { event_id } = await req.json()
  if (!event_id) return apiError('event_id required')

  // Admin operation (promotes an attendee + emails them) — organizers only
  const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const supabase = createAdminClient()

  // Find next in waitlist (lowest position number)
  const { data: next } = await supabase
    .from('registrations')
    .select('*, events(title, venue, starts_at, ends_at)')
    .eq('event_id', event_id)
    .eq('status', 'waitlisted')
    .order('waitlist_position', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!next) return apiSuccess({ promoted: false, message: 'No one on the waitlist' })

  // Generate QR for the promoted person
  let qr_storage_path: string | null = null
  try {
    qr_storage_path = await uploadQrToStorage(next.id, event_id)
  } catch (err) {
    console.error('QR generation failed for promoted registration:', err)
  }

  // Promote — update status and clear waitlist_position
  const { error: updateErr } = await supabase
    .from('registrations')
    .update({ status: 'confirmed', qr_code_url: qr_storage_path, waitlist_position: null })
    .eq('id', next.id)

  if (updateErr) return apiError(updateErr.message, 500)

  // Decrement remaining waitlist positions
  // NOTE: Requires decrement_waitlist_positions RPC function — BE1 creates this in Supabase
  // If it doesn't exist yet, this will fail silently — positions will be fixed on next promotion
  try {
    await supabase.rpc('decrement_waitlist_positions', { p_event_id: event_id })
  } catch {
    console.warn('decrement_waitlist_positions RPC not yet available — skipping')
  }

  // Send promotion email
  // TODO BE2: Uncomment once BE3 has lib/email/send.ts ready
  // const qrSignedUrl = qr_storage_path ? await getQrSignedUrl(qr_storage_path) : null
  // const event = next.events
  // const calendarLink = generateGoogleCalendarLink({ title: event.title, startAt: event.starts_at,
  //   endAt: event.ends_at, location: event.venue })
  // await sendPromotionEmail({ to: next.leader_email, name: next.leader_name,
  //   eventName: event.title, eventDate: formatEventDate(event.starts_at),
  //   venue: event.venue, qrCodeUrl: qrSignedUrl ?? '', calendarLink })

  return apiSuccess({ promoted: true, registration_id: next.id })
}
