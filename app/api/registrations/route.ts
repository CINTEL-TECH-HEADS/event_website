// app/api/registrations/route.ts
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { registrationSchema } from '@/lib/validators/registration'
import { uploadQrToStorage, getQrSignedUrl } from '@/lib/qr/generate'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { sendConfirmationEmail, sendWaitlistEmail } from '@/lib/email/send'
import { rateLimit } from '@/lib/rate-limit'
import { getAuthUser } from '@/lib/auth/get-session'
import { findUserRegistration } from '@/lib/registrations/is-registered'
import { canAccessEvent, isExternalParticipant, SRM_ONLY_MESSAGE } from '@/lib/participants/identity'
import { generateUniqueGroupCode } from '@/lib/registrations/group-code'
import { isTeamNameTaken } from '@/lib/registrations/team-name'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit('register', ip).success) {
    return apiError('Too many registration attempts. Please wait and try again.', 429)
  }

  // Registration requires an account (anonymous registration removed).
  const user = await getAuthUser()
  if (!user) return apiError('Please sign in to register.', 401)

  const body = await req.json()

  // Step 1: Validate
  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.errors[0].message)
  const payload = parsed.data
  const supabase = createAdminClient()

  // Step 1b: Resolve core identity. The form is organizer-driven, so name/email/
  // phone are only present if the organizer configured them — otherwise fall back
  // to the participant's profile and account. leader_email always resolves to the
  // account email so the ticket/QR/confirmation have a valid recipient.
  const { data: reqProfile } = await supabase
    .from('participant_profiles')
    .select('full_name, phone, college_email, personal_email')
    .eq('id', user.id)
    .maybeSingle()

  const leaderEmail = (
    payload.leader_email ||
    reqProfile?.college_email ||
    reqProfile?.personal_email ||
    user.email ||
    ''
  ).toLowerCase()
  const leaderName =
    payload.leader_name || reqProfile?.full_name || user.email!.split('@')[0]
  // leader_phone is NOT NULL in the schema — default to '' when not collected.
  const leaderPhone = payload.leader_phone || reqProfile?.phone || ''

  // Step 2: Load event
  const { data: event } = await supabase
    .from('events')
    .select('id, title, venue, starts_at, ends_at, capacity, waitlist_capacity, fee, registration_closes_at, registration_mode, min_team_size, max_team_size, open_to_external')
    .eq('id', payload.event_id)
    .eq('is_published', true)
    .eq('is_deleted', false)
    .maybeSingle()
  if (!event) return apiError('Event not found', 404)

  // Students from other colleges can only register for events open to them.
  if (!canAccessEvent(await isExternalParticipant(supabase, user.id), event)) {
    return apiError(SRM_ONLY_MESSAGE, 403)
  }

  // Step 2b: registration_type must match what the event allows.
  if (event.registration_mode === 'solo' && payload.registration_type !== 'solo') {
    return apiError('This event only allows solo registration')
  }
  if (event.registration_mode === 'team' && payload.registration_type !== 'team') {
    return apiError('This event only allows team registration')
  }

  // Step 3: Check deadline
  if (new Date() > new Date(event.registration_closes_at)) {
    return apiError('Registration has closed for this event')
  }

  // Step 3b: Account-level duplicate — this user already owns or is a team
  // member of a registration for this event.
  const existing = await findUserRegistration(supabase, event.id, user.id, user.email!)
  if (existing) return apiError('You are already registered for this event')

  // Step 4: Check duplicate leader email
  const { data: dupLeader } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', payload.event_id)
    .eq('leader_email', leaderEmail)
    .maybeSingle()
  if (dupLeader) return apiError('This email is already registered for this event')

  // Step 5: Team-specific checks (group-code model: the creator starts the team
  // with just themselves; other participants join later with the code, so we no
  // longer require members up front and min-size is a soft/portal signal). Any
  // members passed by a legacy caller are still validated + capped.
  if (payload.registration_type === 'team') {
    const members = (payload as any).members ?? []
    const teamSize = members.length + 1 // + the creator
    if (event.max_team_size && teamSize > event.max_team_size)
      return apiError(`Maximum team size is ${event.max_team_size}`)
    const emails = members.map((m: any) => m.email)
    if (new Set(emails).size !== emails.length)
      return apiError('Team has duplicate email addresses')
    if (emails.includes(leaderEmail))
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

  // Step 6: Capacity → confirmed / waitlisted / closed(full)
  let status: 'confirmed' | 'waitlisted' = 'confirmed'
  let waitlist_position: number | null = null

  if (event.capacity !== null) {
    const { count: confirmedCount } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'confirmed')

    if ((confirmedCount ?? 0) >= event.capacity) {
      // Confirmed spots are full — try the waitlist.
      const waitlistCap = event.waitlist_capacity ?? 0
      if (waitlistCap <= 0) {
        return apiError('Registration is closed — this event is full.')
      }
      const { count: waitlistCount } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'waitlisted')
      if ((waitlistCount ?? 0) >= waitlistCap) {
        return apiError('Registration is closed — this event and its waitlist are full.')
      }
      status = 'waitlisted'
      waitlist_position = (waitlistCount ?? 0) + 1
    }
  }

  // Paid events collect payment before issuing the pass; free events don't.
  const isPaid = (event.fee ?? 0) > 0
  const payment_status = isPaid ? 'pending' : 'not_required'
  // Solo paid registrations pay immediately (routed to the pay step). Team
  // registrations pay later — only once the team reaches minimum size — so they
  // are not routed to payment at creation.
  const requiresPayment =
    isPaid && status === 'confirmed' && payload.registration_type === 'solo'

  // Step 6b: Resolve the team name — unique per event; a taken name is rejected.
  let teamName: string | null = null
  if (payload.registration_type === 'team') {
    const rawName = ((payload as any).team_name ?? '').trim()
    if (await isTeamNameTaken(supabase, event.id, rawName)) {
      return apiError('That team name is already taken for this event. Please pick another.')
    }
    teamName = rawName
  }

  // Step 7: Generate IDs (+ a shareable group code for teams)
  const regId      = crypto.randomUUID()
  const display_id = regId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const group_code =
    payload.registration_type === 'team'
      ? await generateUniqueGroupCode(supabase)
      : null

  // Step 8: Generate QR — only for a free confirmed spot. Any paid event (solo or
  // team) issues the QR only after its payment is verified by an organizer.
  let qr_storage_path: string | null = null
  if (status === 'confirmed' && !isPaid) {
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
    team_name:         teamName,
    leader_name:       leaderName,
    leader_email:      leaderEmail,
    leader_phone:      leaderPhone,
    qr_code_url:       qr_storage_path,
    status,
    waitlist_position,
    participant_id:    user.id,
    group_code,
    is_open:           payload.registration_type === 'team',
    payment_status,
  })
  if (insertErr) return apiError(insertErr.message, 500)

  // Step 10: Insert team members — creator is the leader and is linked to their
  // account so the team surfaces in their portal and gets a per-member cert.
  if (payload.registration_type === 'team') {
    const members = (payload as any).members ?? []
    const memberRows = [
      { registration_id: regId, full_name: leaderName, email: leaderEmail, is_leader: true, participant_id: user.id },
      ...members.map((m: any) => ({ registration_id: regId, full_name: m.full_name, email: m.email, is_leader: false, participant_id: null }))
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

  // Step 12: Send confirmation email
  const qrSignedUrl = qr_storage_path
    ? await getQrSignedUrl(qr_storage_path).catch(() => null)
    : null
  const calendarUrl = generateGoogleCalendarLink({
    title:    event.title,
    starts_at: event.starts_at,
    ends_at:   event.ends_at,
    venue:    event.venue,
  })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (status === 'confirmed' && qrSignedUrl) {
    Promise.allSettled([
      sendConfirmationEmail({
        to:          leaderEmail,
        leaderName:  leaderName,
        teamName:    (payload as any).team_name ?? null,
        eventTitle:  event.title,
        eventVenue:  event.venue,
        startsAt:    event.starts_at,
        displayId:   display_id,
        qrCodeUrl:   qrSignedUrl,
        calendarUrl,
        portalUrl:   `${appUrl}/participant/portal`,
      }),
    ])
  } else if (status === 'waitlisted') {
    Promise.allSettled([
      sendWaitlistEmail({
        to:               leaderEmail,
        leaderName:       leaderName,
        eventTitle:       event.title,
        waitlistPosition: waitlist_position ?? undefined,
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
    group_code,
    requires_payment: requiresPayment,
    fee:              event.fee ?? 0,
  })
}