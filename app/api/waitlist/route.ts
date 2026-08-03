// app/api/waitlist/route.ts
// POST — organizer OFFERS a spot to a waitlisted registration. This does not
// confirm them; it flags the offer and emails them to accept in their portal.
// The participant accepts/declines via /api/participant/registrations/[id]/offer.
//
// Body: { event_id, registration_id? }  (registration_id omitted → next in line)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { sendNotificationEmail } from '@/lib/email/send'

export async function POST(req: NextRequest) {
  const { event_id, registration_id } = await req.json()
  if (!event_id) return apiError('event_id required')

  const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  // Pick the target: a specific waitlisted reg, or the next in line.
  let query = admin
    .from('registrations')
    .select('id, leader_name, leader_email, offer_status, events(title)')
    .eq('event_id', event_id)
    .eq('status', 'waitlisted')
  query = registration_id
    ? query.eq('id', registration_id)
    : query.neq('offer_status', 'declined').order('waitlist_position', { ascending: true })
  const { data: target } = await query.limit(1).maybeSingle()

  if (!target) return apiSuccess({ offered: false, message: 'No one available on the waitlist' })
  if (target.offer_status === 'offered') {
    return apiSuccess({ offered: true, registration_id: target.id, message: 'Already offered' })
  }

  const { error } = await admin
    .from('registrations')
    .update({ offer_status: 'offered' })
    .eq('id', target.id)
  if (error) return apiError(error.message, 500)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const eventTitle = (target.events as any)?.title ?? 'the event'
  sendNotificationEmail({
    to: target.leader_email,
    leaderName: target.leader_name,
    subject: `A spot has opened for ${eventTitle}`,
    message: `Good news — a spot has opened up for ${eventTitle} and you've been offered it from the waitlist.\n\nOpen your portal to accept and confirm your spot: ${appUrl}/participant/portal`,
  }).catch(() => {})

  return apiSuccess({ offered: true, registration_id: target.id })
}
