// app/api/events/[id]/payments/[registration_id]/verify/route.ts
// POST — organizer approves or rejects a submitted payment.
//   Body: { action: 'approve' | 'reject', note? }
//   approve → mark the latest submission verified, set the registration paid +
//             confirmed, issue the QR/pass, and email the confirmation.
//   reject  → mark the submission rejected (+ note); the participant can resubmit.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail } from '@/lib/email/send'
import { logAction } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; registration_id: string }> }
) {
  try {
    const { id: eventId, registration_id } = await params
    const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    const { action, note } = await req.json()
    if (!['approve', 'reject'].includes(action)) return apiError('Invalid action')

    const admin = createAdminClient()

    const { data: reg } = await admin
      .from('registrations')
      .select('*, events(title, venue, starts_at, ends_at, fee)')
      .eq('id', registration_id)
      .eq('event_id', eventId)
      .maybeSingle()
    if (!reg) return apiError('Registration not found', 404)

    // Latest submission for this registration.
    const { data: submission } = await admin
      .from('payment_submissions')
      .select('id, status')
      .eq('registration_id', registration_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!submission) return apiError('No payment submission to review.', 404)

    const event = reg.events as any

    if (action === 'reject') {
      await admin
        .from('payment_submissions')
        .update({ status: 'rejected', note: note ?? null, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() })
        .eq('id', submission.id)
      await admin.from('registrations').update({ payment_status: 'rejected' }).eq('id', registration_id)

      await logAction({
        actorId: auth.user.id, actorEmail: auth.user.email,
        action: 'payment.reject', targetType: 'registration', targetId: registration_id,
        eventId, metadata: { note: note ?? null },
      })
      return apiSuccess({ rejected: true })
    }

    // Approve → issue the pass (reuses the simulate flow's QR + email).
    let qr_storage_path: string | null = reg.qr_code_url
    if (!qr_storage_path || !qr_storage_path.startsWith('http')) {
      try {
        qr_storage_path = await uploadQrToStorage(reg.id, reg.event_id)
      } catch (err) {
        console.error('QR generation failed on payment approve:', err)
      }
    }

    await admin
      .from('registrations')
      .update({ payment_status: 'paid', status: 'confirmed', qr_code_url: qr_storage_path })
      .eq('id', registration_id)
    await admin
      .from('payment_submissions')
      .update({ status: 'verified', note: note ?? null, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', submission.id)

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
          title: event?.title, starts_at: event?.starts_at, ends_at: event?.ends_at, venue: event?.venue,
        }),
        portalUrl: `${appUrl}/participant/portal`,
      }).catch(() => {})
    }

    await logAction({
      actorId: auth.user.id, actorEmail: auth.user.email,
      action: 'payment.approve', targetType: 'registration', targetId: registration_id,
      eventId, metadata: {},
    })

    return apiSuccess({ approved: true })
  } catch (err) {
    console.error('[POST /api/events/[id]/payments/[registration_id]/verify]', err)
    return apiError('Internal server error', 500)
  }
}
