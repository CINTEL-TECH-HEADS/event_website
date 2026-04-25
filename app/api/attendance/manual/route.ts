// app/api/attendance/manual/route.ts
// POST /api/attendance/manual — mark one or multiple registrations as attended manually
//
// Body: { event_id: string, registration_ids: string[] }

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { z } from 'zod'

const manualSchema = z.object({
  event_id: z.string().uuid(),
  registration_ids: z.array(z.string().uuid()).min(1, 'At least one registration ID required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = manualSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { event_id, registration_ids } = parsed.data

    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    const admin = createAdminClient()

    // Process each registration individually
    // Per-row loop so we can catch 23505 (already checked in) per row
    // without failing the whole batch
    const results = {
      succeeded: [] as string[],
      skipped: [] as string[],  // already checked in
      failed: [] as string[],
    }

    for (const registration_id of registration_ids) {
      const { error } = await admin
        .from('attendance')
        .insert({
          registration_id,
          event_id,
          method: 'manual',
          checked_in_by: auth.user.id,
        })

      if (!error) {
        results.succeeded.push(registration_id)
      } else if (error.code === '23505') {
        results.skipped.push(registration_id)  // already checked in
      } else {
        console.error(`[manual attendance] failed for ${registration_id}:`, error)
        results.failed.push(registration_id)
      }
    }

    return NextResponse.json({ data: results, error: null })
  } catch (err) {
    console.error('[POST /api/attendance/manual]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}