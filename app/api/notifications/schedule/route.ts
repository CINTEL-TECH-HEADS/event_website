// app/api/notifications/schedule/route.ts
// POST /api/notifications/schedule
// Schedules 24h and 1h reminder jobs for an event using Supabase pg_cron.
//
// Body: { event_id: string }
//
// ⚠  SETUP REQUIRED:
//   Enable pg_cron in Supabase: Dashboard → Database → Extensions → search pg_cron → enable
//   Also enable pg_net (needed for HTTP calls from cron jobs)

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { z } from 'zod'

const scheduleSchema = z.object({
  event_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = scheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { event_id } = parsed.data

    const auth = await requireOrganizerRole(event_id, ['owner'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    // Fetch the event's start time
    const { data: event } = await admin
      .from('events')
      .select('starts_at, title')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json(
        { data: null, error: 'Event not found' },
        { status: 404 }
      )
    }

    const startsAt = new Date(event.starts_at)
    const reminder24h = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000)
    const reminder1h = new Date(startsAt.getTime() - 60 * 60 * 1000)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    // Helper to convert Date to cron expression
    // pg_cron format: "minute hour day month *"
    const toCron = (date: Date) =>
      `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`

    const jobName24h = `reminder_24h_${event_id}`
    const jobName1h = `reminder_1h_${event_id}`

    // Schedule 24h reminder
    const { error: err24h } = await admin.rpc('schedule_notification_job', {
      p_job_name: jobName24h,
      p_schedule: toCron(reminder24h),
      p_event_id: event_id,
      p_app_url: appUrl,
    })

    // Schedule 1h reminder
    const { error: err1h } = await admin.rpc('schedule_notification_job', {
      p_job_name: jobName1h,
      p_schedule: toCron(reminder1h),
      p_event_id: event_id,
      p_app_url: appUrl,
    })

    if (err24h || err1h) {
      console.warn('[schedule] RPC error — pg_cron may not be enabled:', err24h || err1h)
      // Non-fatal — reminders can be sent manually via POST /api/notifications
      return NextResponse.json({
        data: {
          message: 'Reminders could not be scheduled automatically. Send manually via /api/notifications.',
          scheduled: false,
        },
        error: null,
      })
    }

    return NextResponse.json({
      data: {
        message: `Reminders scheduled for ${event.title}`,
        reminder24h: reminder24h.toISOString(),
        reminder1h: reminder1h.toISOString(),
        scheduled: true,
      },
      error: null,
    })
  } catch (err) {
    console.error('[POST /api/notifications/schedule]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}