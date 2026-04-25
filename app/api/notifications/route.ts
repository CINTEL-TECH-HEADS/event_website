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
import { sendReminderEmail } from '@/lib/email/send'
import { sendReminderWhatsApp } from '@/lib/whatsapp/send'
import { z } from 'zod'

const notifySchema = z.object({
  event_id: z.string().uuid(),
  type: z.enum(['confirmation', 'reminder', 'custom']),
  message: z.string().optional(),
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

    const { event_id, type, registration_ids } = parsed.data

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

    // Send notifications (fire and forget per registrant)
    let sent = 0
    for (const reg of registrations) {
      if (type === 'reminder') {
        // Send email + WhatsApp reminder
        await sendReminderEmail({
          to: reg.leader_email,
          leaderName: reg.leader_name,
          eventTitle: event.title,
          eventVenue: event.venue,
          startsAt: event.starts_at,
          displayId: reg.display_id,
          isOneHour: false,
        })
        await sendReminderWhatsApp({
          to: reg.leader_phone,
          leaderName: reg.leader_name,
          eventTitle: event.title,
          startsAt: event.starts_at,
          venue: event.venue,
          isOneHour: false,
        })
      }

      // Log to notifications_log
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
      data: { sent, total: registrations.length },
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