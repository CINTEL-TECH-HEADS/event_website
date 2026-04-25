// Owner: BE2
// POST /api/resend-confirmation — resend QR email to registrant by email
// Checks both leader_email and team_members.email
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { maskEmail, formatEventDate } from '@/lib/utils'
import { getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail } from '@/lib/email/send'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { email, event_id } = await req.json()

  if (!email || !event_id) return apiError('email and event_id are required')

  // Rate limit
  const limit = rateLimit('resend', email)
  if (!limit.success) return apiError('Too many resend requests. Try again later.', 429)

  const supabase = createAdminClient()

  // 1. Try leader email first
  let reg: any = null
  const { data: byLeader } = await supabase
    .from('registrations')
    .select('*, events(title, venue, starts_at, ends_at)')
    .eq('event_id', event_id)
    .eq('leader_email', email)
    .maybeSingle()

  if (byLeader) {
    reg = byLeader
  } else {
    // 2. Try team member email
    const { data: member } = await supabase
      .from('team_members')
      .select('registration_id, registrations!inner(*, events(title, venue, starts_at, ends_at))')
      .eq('email', email)
      .eq('registrations.event_id', event_id)
      .maybeSingle()

    if (member) reg = (member as any).registrations
  }

  if (!reg) return apiError('No registration found with this email for the selected event')
  if (reg.status === 'waitlisted') return apiSuccess({ message: `You're on the waitlist. We'll email you if a spot opens.` })
  if (reg.status === 'cancelled')  return apiError('This registration has been cancelled')

  // Get fresh signed QR URL
  let qrSignedUrl: string | null = null
  if (reg.qr_code_url) {
    qrSignedUrl = await getQrSignedUrl(reg.qr_code_url).catch(() => null)
  }

  const event = reg.events
  const calendarLink = generateGoogleCalendarLink({
    title: event.title,
    startAt: event.starts_at,
    endAt: event.ends_at,
    location: event.venue,
  })

  await sendConfirmationEmail({
    to: email,
    leaderName: reg.leader_name,
    teamName: reg.team_name,
    eventTitle: event.title,
    eventVenue: event.venue,
    startsAt: event.starts_at,
    displayId: reg.display_id,
    qrCodeUrl: qrSignedUrl ?? '',
    calendarUrl: calendarLink,
    resendUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resend`
  })

  console.log(`[Resend OK] Confirmation dispatched to ${email} for event ${event_id}`)

  return apiSuccess({ message: `Confirmation resent to ${maskEmail(email)}` })
}
