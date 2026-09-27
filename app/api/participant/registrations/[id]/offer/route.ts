// app/api/participant/registrations/[id]/offer/route.ts
// POST — the waitlisted participant responds to an organizer's spot offer.
// Body: { action: 'accept' | 'decline' }
//   decline → offer_status='declined' (frees the offer for the next person).
//   accept  → free event: confirm + issue pass now; paid event: needs payment
//             (returns requires_payment so the portal routes to the pay step).

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { isRegistrationOwner, linkParticipantIfUnset } from '@/lib/registrations/access'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail } from '@/lib/email/send'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in.', 401)

    const { action } = await req.json()
    if (!['accept', 'decline'].includes(action)) return apiError('Invalid action')

    const admin = createAdminClient()
    const { data: reg } = await admin
      .from('registrations')
      .select('*, events(title, venue, starts_at, ends_at, fee)')
      .eq('id', id)
      .maybeSingle()
    if (!reg) return apiError('Registration not found', 404)
    if (!(await isRegistrationOwner(admin, reg, user))) return apiError('Forbidden', 403)
    await linkParticipantIfUnset(admin, reg, user.id)
    if (reg.offer_status !== 'offered') return apiError('No active offer for this registration')

    if (action === 'decline') {
      await admin.from('registrations').update({ offer_status: 'declined' }).eq('id', id)
      return apiSuccess({ declined: true })
    }

    // Accept.
    const event = reg.events as any
    const isPaid = (event?.fee ?? 0) > 0

    if (isPaid) {
      // Mark accepted; payment step confirms + issues the pass.
      await admin
        .from('registrations')
        .update({ offer_status: 'accepted', payment_status: 'pending' })
        .eq('id', id)
      return apiSuccess({ accepted: true, requires_payment: true, fee: event.fee })
    }

    // Free event — confirm and issue the pass now.
    let qr_storage_path: string | null = null
    try {
      qr_storage_path = await uploadQrToStorage(reg.id, reg.event_id)
    } catch (err) {
      console.error('QR generation failed on offer accept:', err)
    }
    await admin
      .from('registrations')
      .update({
        offer_status: 'accepted',
        status: 'confirmed',
        payment_status: 'not_required',
        qr_code_url: qr_storage_path,
        waitlist_position: null,
      })
      .eq('id', id)

    const qrSignedUrl = qr_storage_path ? await getQrSignedUrl(qr_storage_path).catch(() => null) : null
    if (qrSignedUrl) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      sendConfirmationEmail({
        to: reg.leader_email,
        leaderName: reg.leader_name,
        teamName: reg.team_name ?? null,
        eventTitle: event?.title,
        eventVenue: event?.venue,
        startsAt: event?.starts_at,
        displayId: reg.display_id,
        qrCodeUrl: qrSignedUrl,
        calendarUrl: generateGoogleCalendarLink({
          title: event?.title,
          starts_at: event?.starts_at,
          ends_at: event?.ends_at,
          venue: event?.venue,
        }),
        portalUrl: `${appUrl}/participant/portal`,
      }).catch(() => {})
    }

    return apiSuccess({ accepted: true, confirmed: true })
  } catch (err) {
    console.error('[POST /api/participant/registrations/[id]/offer]', err)
    return apiError('Internal server error', 500)
  }
}
