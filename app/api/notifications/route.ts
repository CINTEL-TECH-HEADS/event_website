// app/api/notifications/route.ts
// POST /api/notifications — send a manual notification to all or selected registrants
//
// Body: {
//   event_id:          string
//   type:              'confirmation' | 'reminder' | 'custom'
//   message?:          string        (required when type = 'custom')
//   registration_ids?: string[]      (optional — send to specific registrants only)
//                                    omit to send to ALL confirmed registrants
// }

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { sendNotificationEmail } from '@/lib/email/send'
import { z } from 'zod'

// Human labels for the notification types the dashboard offers.
const TYPE_LABELS: Record<string, string> = {
  confirmation: 'Registration Confirmation',
  reminder_24h: '24-Hour Reminder',
  reminder_1h: '1-Hour Reminder',
  venue_change: 'Venue Change',
  time_change: 'Time Change',
  cancellation: 'Cancellation Notice',
}

const notifySchema = z.object({
  event_id: z.string().uuid(),
  type: z.string().min(1),
  custom_message: z.string().max(500).optional(),
  target: z.enum(['all_confirmed', 'custom']).optional(),
  registration_ids: z.array(z.string().uuid()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = notifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { event_id, type, custom_message, target, registration_ids } = parsed.data
    if (target === 'custom' && !(registration_ids && registration_ids.length > 0)) {
      return NextResponse.json(
        { data: null, error: 'Select at least one participant for a custom send.' },
        { status: 400 }
      )
    }

    // Auth — owner or sub_admin only
    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    // Fetch the event
    const { data: event } = await admin
      .from('events')
      .select('title, venue, starts_at')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json(
        { data: null, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch target registrations
    let query = admin
      .from('registrations')
      .select('id, leader_name, leader_email, leader_phone, display_id, status')
      .eq('event_id', event_id)
      .eq('status', 'confirmed')

    if (registration_ids && registration_ids.length > 0) {
      query = query.in('id', registration_ids)
    }

    const { data: registrations, error: regError } = await query

    if (regError || !registrations) {
      return NextResponse.json(
        { data: null, error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }

    const label = TYPE_LABELS[type] ?? 'Notification'
    const subject = `${event.title} — ${label}`
    const message =
      custom_message?.trim() ||
      `This is a ${label.toLowerCase()} for ${event.title}${event.venue ? ` at ${event.venue}` : ''}.`

    // Send emails to the target registrants.
    let sent = 0
    for (const reg of registrations) {
      await sendNotificationEmail({
        to: reg.leader_email,
        leaderName: reg.leader_name,
        subject,
        message,
      })

      await admin.from('notifications_log').insert({
        event_id: event_id,
        registration_id: reg.id,
        type,
        channel: 'email',
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      sent++
    }

    return NextResponse.json({
      data: { sent_count: sent, total: registrations.length },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/notifications]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}