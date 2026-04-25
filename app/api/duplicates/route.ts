// app/api/duplicates/route.ts
//
// GET  /api/duplicates?event_id=xxx        — list unreviewed duplicate flags
// POST /api/duplicates                     — dismiss or delete a flagged registration
//
// POST body:
//   { action: 'dismiss', flag_id }   — marks flag as reviewed (registration is legit)
//   { action: 'delete',  flag_id }   — deletes the flagged registration entirely

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { z } from 'zod'

// ── GET — list flags ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const event_id = searchParams.get('event_id')

    if (!event_id) {
      return NextResponse.json(
        { data: null, error: 'event_id is required' },
        { status: 400 }
      )
    }

    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    const { data: flags, error } = await admin
      .from('duplicate_flags')
      .select(`
        id, reason, reviewed, created_at,
        registrations (
          id, display_id, leader_name, leader_email,
          leader_phone, registration_type, registered_at
        )
      `)
      .eq('event_id', event_id)
      .eq('reviewed', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/duplicates]', error)
      return NextResponse.json(
        { data: null, error: 'Failed to fetch duplicate flags' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: flags, error: null })
  } catch (err) {
    console.error('[GET /api/duplicates]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── POST — dismiss or delete ──────────────────────────────────
const actionSchema = z.object({
  action: z.enum(['dismiss', 'delete']),
  flag_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = actionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { action, flag_id } = parsed.data
    const admin = createAdminClient()

    // Fetch the flag to get event_id and registration_id
    const { data: flag } = await admin
      .from('duplicate_flags')
      .select('id, event_id, registration_id')
      .eq('id', flag_id)
      .single()

    if (!flag) {
      return NextResponse.json(
        { data: null, error: 'Flag not found' },
        { status: 404 }
      )
    }

    const auth = await requireOrganizerRole(flag.event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    if (action === 'dismiss') {
      // Mark as reviewed — registration stays
      const { error } = await admin
        .from('duplicate_flags')
        .update({ reviewed: true, reviewed_by: auth.user.id })
        .eq('id', flag_id)

      if (error) {
        return NextResponse.json(
          { data: null, error: 'Failed to dismiss flag' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { data: { message: 'Flag dismissed — registration kept' }, error: null }
      )
    }

    if (action === 'delete') {
      // Delete the registration — cascade deletes answers, attendance, flag
      const { error } = await admin
        .from('registrations')
        .delete()
        .eq('id', flag.registration_id)

      if (error) {
        console.error('[POST /api/duplicates delete]', error)
        return NextResponse.json(
          { data: null, error: 'Failed to delete registration' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { data: { message: 'Registration deleted' }, error: null }
      )
    }
  } catch (err) {
    console.error('[POST /api/duplicates]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}