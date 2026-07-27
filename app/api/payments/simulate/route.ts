// app/api/payments/simulate/route.ts
// POST — simulate a successful payment for a registration (real gateway deferred).
// Marks the registration paid + confirmed, generates the QR/pass, emails the
// confirmation. Auth: the registration's owner.
//
// Body: { registration_id }

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail } from '@/lib/email/send'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in.', 401)

    const { registration_id } = await req.json()
    if (!registration_id) return apiError('registration_id is required')

    const admin = createAdminClient()
    const { data: reg } = await admin
      .from('registrations')
      .select('*, events(title, venue, starts_at, ends_at, fee)')
      .eq('id', registration_id)
      .maybeSingle()
    if (!reg) return apiError('Registration not found', 404)
    if (reg.participant_id !== user.id) return apiError('Forbidden', 403)
    if (reg.payment_status === 'paid') {
      return apiSuccess({ registration_id, already_paid: true })
    }

    const event = reg.events as any

    // Generate the QR/pass now that payment is (simulated) complete.
    let qr_storage_path: string | null = reg.qr_code_url
    if (!qr_storage_path || !qr_storage_path.startsWith('http')) {
      try {
        qr_storage_path = await uploadQrToStorage(reg.id, reg.event_id)
      } catch (err) {
        console.error('QR generation failed on payment:', err)
      }
    }

    const { error: updErr } = await admin
      .from('registrations')
      .update({ payment_status: 'paid', status: 'confirmed', qr_code_url: qr_storage_path })
      .eq('id', reg.id)
    if (updErr) return apiError(updErr.message, 500)

    // Send the confirmation email with the pass.
    const qrSignedUrl = qr_storage_path
      ? await getQrSignedUrl(qr_storage_path).catch(() => null)
      : null
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
        resendUrl: `${appUrl}/resend`,
      }).catch(() => {})
    }

    return apiSuccess({ registration_id, paid: true, qr_code_url: qrSignedUrl })
  } catch (err) {
    console.error('[POST /api/payments/simulate]', err)
    return apiError('Internal server error', 500)
  }
}
