// app/api/registrations/route.ts
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { registrationSchema } from '@/lib/validators/registration'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail, sendWaitlistEmail } from '@/lib/email/send'
import { sendConfirmationWhatsApp } from '@/lib/whatsapp/send'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Step 1: Validate
  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message)
  const payload = parsed.data
  const supabase = createAdminClient()

  // Step 2: Load event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, venue, starts_at, ends_at, capacity, registration_closes_at, registration_mode, min_team_size, max_team_size')
    .eq('id', payload.event_id)
    .eq('is_published', true)
    .maybeSingle()
  if (!event) return apiError('Event not found', 404)

  // Step 3: Check deadline
  if (new Date() > new Date(event.registration_closes_at)) {
    return apiError('Registration has closed for this event')
  }

  // Step 4: Check duplicate leader email
  const { data: dupLeader } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', payload.event_id)
    .eq('leader_email', payload.leader_email)
    .maybeSingle()
  if (dupLeader) return apiError('This email is already registered for this event')

  // Step 5: Team-specific checks
  if (payload.registration_type === 'team') {
    const members = (payload as any).members ?? []
    if (event.min_team_size && members.length < event.min_team_size)
      return apiError(`Minimum team size is ${event.min_team_size}`)
    if (event.max_team_size && members.length > event.max_team_size)
      return apiError(`Maximum team size is ${event.max_team_size}`)
    const emails = members.map((m: any) => m.email)
    if (new Set(emails).size !== emails.length)
      return apiError('Team has duplicate email addresses')
    if (emails.includes(payload.leader_email))
      return apiError('Leader email cannot also be listed as a team member')
    if (emails.length > 0) {
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('email, registrations!inner(event_id)')
        .in('email', emails)
        .eq('registrations.event_id', payload.event_id)
      if (existingMembers?.length)
        return apiError(`${existingMembers[0].email} is already registered for this event`)
    }
  }

  // Step 6: Capacity check
  let status: 'confirmed' | 'waitlisted' = 'confirmed'
  let waitlist_position: number | null = null

  if (event.capacity !== null) {
    const { count } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'confirmed')
    if ((count ?? 0) >= event.capacity) {
      status = 'waitlisted'
      const { data: lastWaitlist } = await supabase
        .from('registrations')
        .select('waitlist_position')
        .eq('event_id', event.id)
        .eq('status', 'waitlisted')
        .order('waitlist_position', { ascending: false })
        .limit(1)
        .maybeSingle()
      waitlist_position = (lastWaitlist?.waitlist_position ?? 0) + 1
    }
  }

  // Step 7: Generate IDs
  const regId      = crypto.randomUUID()
  const display_id = regId.replace(/-/g, '').slice(0, 8).toUpperCase()

  // Step 8: Generate QR
  let qr_storage_path: string | null = null
  if (status === 'confirmed') {
    try {
      qr_storage_path = await uploadQrToStorage(regId, event.id)
    } catch (err) {
      console.error('QR generation failed:', err)
    }
  }

  // Step 9: Insert registration
  const { error: insertErr } = await supabase.from('registrations').insert({
    id:                regId,
    display_id,
    event_id:          payload.event_id,
    registration_type: payload.registration_type,
    team_name:         (payload as any).team_name ?? null,
    leader_name:       payload.leader_name,
    leader_email:      payload.leader_email,
    leader_phone:      payload.leader_phone,
    qr_code_url:       qr_storage_path,
    status,
    waitlist_position,
  })
  if (insertErr) return apiError(insertErr.message, 500)

  // Step 10: Insert team members
  if (payload.registration_type === 'team') {
    const members = (payload as any).members ?? []
    const memberRows = [
      { registration_id: regId, full_name: payload.leader_name, email: payload.leader_email, is_leader: true },
      ...members.map((m: any) => ({ registration_id: regId, full_name: m.full_name, email: m.email, is_leader: false }))
    ]
    await supabase.from('team_members').insert(memberRows)
  }

  // Step 11: Insert registration answers
  if (payload.answers?.length) {
    await supabase.from('registration_answers').insert(
      payload.answers.map((a: any) => ({
        registration_id: regId,
        field_id:        a.field_id,
        member_id:       null,
        answer:          a.answer,
      }))
    )
  }

  // Step 12: Send email + WhatsApp
  const qrSignedUrl = qr_storage_path
    ? await getQrSignedUrl(qr_storage_path).catch(() => null)
    : null
  const calendarUrl = generateGoogleCalendarLink({
    title:    event.title,
    startsAt: event.starts_at,
    endsAt:   event.ends_at,
    venue:    event.venue,
  })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (status === 'confirmed' && qrSignedUrl) {
    Promise.allSettled([
      sendConfirmationEmail({
        to:          payload.leader_email,
        leaderName:  payload.leader_name,
        teamName:    (payload as any).team_name ?? null,
        eventTitle:  event.title,
        eventVenue:  event.venue,
        startsAt:    event.starts_at,
        displayId:   display_id,
        qrCodeUrl:   qrSignedUrl,
        calendarUrl,
        resendUrl:   `${appUrl}/resend`,
      }),
      sendConfirmationWhatsApp({
        to:         payload.leader_phone,
        leaderName: payload.leader_name,
        eventTitle: event.title,
        startsAt:   event.starts_at,
        venue:      event.venue,
        displayId:  display_id,
      }),
    ])
  } else if (status === 'waitlisted') {
    Promise.allSettled([
      sendWaitlistEmail({
        to:               payload.leader_email,
        leaderName:       payload.leader_name,
        eventTitle:       event.title,
        waitlistPosition: waitlist_position!,
      }),
    ])
  }

  // Step 13: Return
  return apiSuccess({
    registration_id: regId,
    display_id,
    qr_code_url:     qrSignedUrl,
    status,
    waitlist_position,
  })
}