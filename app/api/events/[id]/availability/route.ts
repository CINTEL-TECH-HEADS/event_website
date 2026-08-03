// app/api/events/[id]/availability/route.ts
// GET — live registration availability for an event, so the public event/register
// pages can show open / waitlist / full clearly.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const admin = createAdminClient()

    const { data: event } = await admin
      .from('events')
      .select('capacity, waitlist_capacity, fee')
      .eq('id', eventId)
      .maybeSingle()
    if (!event) return apiError('Event not found', 404)

    const { count: confirmed } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed')
    const { count: waitlisted } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'waitlisted')

    const cap = event.capacity
    const wcap = event.waitlist_capacity ?? 0
    const confirmedN = confirmed ?? 0
    const waitlistedN = waitlisted ?? 0

    let state: 'open' | 'waitlist' | 'full' = 'open'
    let spots_left: number | null = null
    if (cap == null) {
      state = 'open' // unlimited
    } else if (confirmedN < cap) {
      state = 'open'
      spots_left = cap - confirmedN
    } else if (wcap > 0 && waitlistedN < wcap) {
      state = 'waitlist'
      spots_left = 0
    } else {
      state = 'full'
      spots_left = 0
    }

    return apiSuccess({
      capacity: cap,
      waitlist_capacity: event.waitlist_capacity ?? null,
      fee: event.fee ?? 0,
      confirmed: confirmedN,
      waitlisted: waitlistedN,
      spots_left,
      state,
    })
  } catch (err) {
    console.error('[GET /api/events/[id]/availability]', err)
    return apiError('Internal server error', 500)
  }
}
