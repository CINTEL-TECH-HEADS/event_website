// app/api/attendance/route.ts
// POST /api/attendance — QR code check-in
//
// Body: { registration_id: string, event_id: string }
//
// Flow:
//   1. Validate UUID format
//   2. Look up registration
//   3. Check status is 'confirmed' (not waitlisted/cancelled)
//   4. Check event_id matches (prevents cross-event QR use)
//   5. INSERT into attendance — UNIQUE constraint handles race conditions
//   6. Return attendee details for the scanner UI

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { rateLimit } from '@/lib/rate-limit'
import { logAction } from '@/lib/audit/log'
import { z } from 'zod'

const checkInSchema = z.object({
  registration_id: z.string().uuid('Invalid registration ID'),
  event_id: z.string().uuid('Invalid event ID'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limit — 60 scans per minute per IP
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const { success: rateLimitOk } = rateLimit('checkin', ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { data: null, error: 'Too many requests. Slow down.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = checkInSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { registration_id, event_id } = parsed.data

    // Auth — owner or sub_admin only
    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    // Look up registration
    const { data: registration, error: regError } = await admin
      .from('registrations')
      .select('id, event_id, status, leader_name, team_name, registration_type')
      .eq('id', registration_id)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { data: null, error: 'Registration not found. Invalid QR code.' },
        { status: 404 }
      )
    }

    // Check event matches
    if (registration.event_id !== event_id) {
      return NextResponse.json(
        { data: null, error: 'This QR code is for a different event.' },
        { status: 400 }
      )
    }

    // Check status
    if (registration.status === 'cancelled') {
      return NextResponse.json(
        { data: null, error: 'This registration has been cancelled.' },
        { status: 400 }
      )
    }

    if (registration.status === 'waitlisted') {
      return NextResponse.json(
        { data: null, error: 'This registration is on the waitlist and has not been confirmed.' },
        { status: 400 }
      )
    }

    // Fetch team members if team registration
    const { data: members } = await admin
      .from('team_members')
      .select('full_name, email')
      .eq('registration_id', registration_id)

    // INSERT attendance — UNIQUE constraint on registration_id prevents duplicates
    const { data: attendanceRecord, error: insertError } = await admin
      .from('attendance')
      .insert({
        registration_id,
        event_id,
        method: 'qr_scan',
        checked_in_by: auth.user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Postgres unique violation code — already checked in
      if (insertError.code === '23505') {
        return NextResponse.json(
          { data: null, error: 'Already checked in.' },
          { status: 409 }
        )
      }
      console.error('[POST /api/attendance]', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'attendance.checkin',
      targetType: 'registration',
      targetId: registration_id,
      eventId: event_id,
      metadata: { method: 'qr_scan' },
    })

    return NextResponse.json({
      data: {
        leader_name: registration.leader_name,
        team_name: registration.team_name,
        registration_type: registration.registration_type,
        members: members ?? [],
        checked_in_at: attendanceRecord.checked_in_at,
      },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/attendance]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}