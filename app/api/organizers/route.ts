// app/api/organizers/route.ts
// POST /api/organizers — assign a sub_admin or judge to an event
//
// Body: { event_id, email, role }
// role must be 'sub_admin' or 'judge' — owners are assigned on event creation
// Only the event owner or superadmin can call this

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'
import { z } from 'zod'

const assignSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  email: z.string().email('Invalid email'),
  role: z.enum(['sub_admin', 'judge']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = assignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { event_id, email, role } = parsed.data

    // Only owners can assign organizers
    const auth = await requireOrganizerRole(event_id, ['owner'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    // Look up the profile by email
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { data: null, error: 'No organizer account found with that email. They need to sign up first.' },
        { status: 404 }
      )
    }

    // Check not already assigned
    const { data: existing } = await admin
      .from('event_organizers')
      .select('id')
      .eq('event_id', event_id)
      .eq('profile_id', profile.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'This person is already an organizer for this event.' },
        { status: 409 }
      )
    }

    // Insert
    const { data: organizer, error: insertError } = await admin
      .from('event_organizers')
      .insert({ event_id, profile_id: profile.id, role })
      .select()
      .single()

    if (insertError) {
      console.error('[POST /api/organizers]', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to assign organizer' },
        { status: 500 }
      )
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'organizer.add',
      targetType: 'organizer',
      targetId: profile.id,
      eventId: event_id,
      metadata: { role, email },
    })

    return NextResponse.json({ data: organizer, error: null }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/organizers]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}