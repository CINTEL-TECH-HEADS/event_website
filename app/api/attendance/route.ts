// app/api/attendance/route.ts
// POST /api/attendance — QR code check-in
//
// Body: { registration_id: string, event_id: string, member_ids?: string[] }
//
// Solo pass → checked in straight away (409 if already checked in).
// Team pass → without member_ids, nothing is recorded: the response lists the
// members (and who is already present) so the scanner can ask who is here.
// With member_ids → exactly those members are marked present.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { rateLimit } from '@/lib/rate-limit'
import { loadAttendance, setAttendance } from '@/lib/attendance/set'
import { z } from 'zod'

const checkInSchema = z.object({
  registration_id: z.string().uuid('Invalid registration ID'),
  event_id: z.string().uuid('Invalid event ID'),
  member_ids: z.array(z.string().uuid()).optional(),
})

const fail = (error: string, status: number) =>
  NextResponse.json({ data: null, error }, { status })

export async function POST(req: NextRequest) {
  try {
    // Rate limit — 60 scans per minute per IP
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const { success: rateLimitOk } = rateLimit('checkin', ip)
    if (!rateLimitOk) return fail('Too many requests. Slow down.', 429)

    const body = await req.json()
    const parsed = checkInSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.errors[0].message, 400)

    const { registration_id, event_id, member_ids } = parsed.data

    // Auth — owner or sub_admin only
    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) return fail(auth.error, auth.status)

    const admin = createAdminClient()
    const loaded = await loadAttendance(admin, event_id, registration_id)
    if ('error' in loaded) return fail(loaded.error, loaded.status)
    const { state } = loaded

    if (state.registration_type === 'team') {
      // First scan of a team pass: ask who is here before recording anything.
      if (!member_ids) {
        return NextResponse.json({ data: { needs_members: true, ...state }, error: null })
      }
      if (member_ids.length === 0) return fail('Tick at least one member who is here.', 400)
    } else if (state.checked_in_at) {
      return fail('Already checked in.', 409)
    }

    const result = await setAttendance(admin, {
      eventId: event_id,
      registrationId: registration_id,
      present: true,
      memberIds: member_ids,
      method: 'qr_scan',
      actor: auth.user,
    })
    if ('error' in result) return fail(result.error, result.status)

    return NextResponse.json({ data: result.state, error: null })
  } catch (err) {
    console.error('[POST /api/attendance]', err)
    return fail('Internal server error', 500)
  }
}
