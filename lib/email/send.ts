// lib/email/send.ts
// All 5 email send functions.
// Import and call these from BE2 (registration, waitlist)
// and BE4 (certificates).
//
// All functions are fire-and-forget — they log errors but
// never throw. The registration flow should not fail just
// because an email couldn't send.

import { render } from '@react-email/render'
import { resend } from '@/lib/email/resend'
import { ConfirmationEmail } from '@/lib/email/templates/ConfirmationEmail'
import { WaitlistEmail } from '@/lib/email/templates/WaitlistEmail'
import { PromotionEmail } from '@/lib/email/templates/PromotionEmail'
import { ReminderEmail } from '@/lib/email/templates/ReminderEmail'
import { CertificateReadyEmail } from '@/lib/email/templates/CertificateReadyEmail'

const FROM = process.env.EMAIL_FROM!

// ── 1. Confirmation email ─────────────────────────────────────
// Called after successful registration (confirmed status)

interface SendConfirmationParams {
  to: string
  leaderName: string
  teamName: string | null
  eventTitle: string
  eventVenue: string
  startsAt: string
  displayId: string
  qrCodeUrl: string
  calendarUrl: string
  resendUrl: string
}

export async function sendConfirmationEmail(params: SendConfirmationParams) {
  try {
    const html = await render(ConfirmationEmail(params))
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `You're registered for ${params.eventTitle} — QR code inside`,
      html,
    })
  } catch (err) {
    console.error('[sendConfirmationEmail] failed:', err)
  }
}

// ── 2. Waitlist email ─────────────────────────────────────────
// Called after registration when event is at capacity

interface SendWaitlistParams {
  to: string
  leaderName: string
  eventTitle: string
  waitlistPosition: number
}

export async function sendWaitlistEmail(params: SendWaitlistParams) {
  try {
    const html = await render(WaitlistEmail(params))
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `You're on the waitlist for ${params.eventTitle} — position #${params.waitlistPosition}`,
      html,
    })
  } catch (err) {
    console.error('[sendWaitlistEmail] failed:', err)
  }
}

// ── 3. Promotion email ────────────────────────────────────────
// Called when someone cancels and the next waitlisted person is promoted

interface SendPromotionParams {
  to: string
  leaderName: string
  eventTitle: string
  eventVenue: string
  startsAt: string
  displayId: string
  qrCodeUrl: string
  calendarUrl: string
}

export async function sendPromotionEmail(params: SendPromotionParams) {
  try {
    const html = await render(PromotionEmail(params))
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `A spot opened up for ${params.eventTitle} — you're in!`,
      html,
    })
  } catch (err) {
    console.error('[sendPromotionEmail] failed:', err)
  }
}

// ── 4. Reminder email ─────────────────────────────────────────
// Called by the notification scheduler — 24h and 1h before event

interface SendReminderParams {
  to: string
  leaderName: string
  eventTitle: string
  eventVenue: string
  startsAt: string
  displayId: string
  isOneHour: boolean
}

export async function sendReminderEmail(params: SendReminderParams) {
  try {
    const html = await render(ReminderEmail(params))
    const subject = params.isOneHour
      ? `${params.eventTitle} starts in 1 hour — have your QR ready`
      : `${params.eventTitle} is tomorrow — see you there!`

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[sendReminderEmail] failed:', err)
  }
}

// ── 5. Certificate ready email ────────────────────────────────
// Called by BE4 after certificates are generated and released

interface SendCertificateReadyParams {
  to: string
  leaderName: string
  eventTitle: string
  certificateUrl: string
}

export async function sendCertificateReadyEmail(params: SendCertificateReadyParams) {
  try {
    const html = await render(CertificateReadyEmail(params))
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your certificate for ${params.eventTitle} is ready`,
      html,
    })
  } catch (err) {
    console.error('[sendCertificateReadyEmail] failed:', err)
  }
}