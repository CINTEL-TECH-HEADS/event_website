// app/api/certificates/assignments/route.ts
//
// GET  /api/certificates/assignments?event_id=<uuid>
//   → returns all existing assignments for this event
//
// POST /api/certificates/assignments
//   → bulk save assignments (select-and-update / insert)
//   Body: { event_id: string, assignments: AssignmentInput[] }
//
// AssignmentInput:
//   { registration_id, team_member_id | null, certificate_type, template_id | null }
//
// Solves partial index matching limitations with Supabase JS client .upsert()
// by querying existing assignments for the event and performing explicit
// updates for existing rows and inserts for new rows.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

const VALID_CERT_TYPES = [
  'Participation',
  'Winner',
  'Runner Up',
  '2nd Runner Up',
  'Not Eligible',
]

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('event_id')

  if (!eventId) return apiError('event_id is required', 400)

  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('certificate_assignments')
    .select('id, event_id, registration_id, team_member_id, template_id, certificate_type, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return apiError(error.message, 500)
  return apiSuccess(data ?? [])
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, assignments } = body

    if (!event_id) return apiError('event_id is required', 400)
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return apiError('assignments must be a non-empty array', 400)
    }

    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    // Validate each assignment input
    for (const a of assignments) {
      if (!a.registration_id) return apiError('Each assignment must have registration_id', 400)
      if (!VALID_CERT_TYPES.includes(a.certificate_type)) {
        return apiError(`Invalid certificate_type: ${a.certificate_type}`, 400)
      }
    }

    const admin = createAdminClient()

    // 1. Fetch all existing assignments for this event to resolve existing record IDs
    const { data: existingRows, error: fetchErr } = await admin
      .from('certificate_assignments')
      .select('id, registration_id, team_member_id')
      .eq('event_id', event_id)

    if (fetchErr) {
      console.error('[POST /api/certificates/assignments] Error fetching existing assignments:', fetchErr)
      return apiError(`Failed to fetch existing assignments: ${fetchErr.message}`, 500)
    }

    const existingList = existingRows ?? []

    // Helper to find existing assignment ID for a (registration_id, team_member_id) recipient
    const findExistingId = (regId: string, memberId: string | null): string | null => {
      const match = existingList.find((row) => {
        if (row.registration_id !== regId) return false
        if (memberId === null) return row.team_member_id === null
        return row.team_member_id === memberId
      })
      return match ? match.id : null
    }

    const toInsert: {
      event_id: string
      registration_id: string
      team_member_id: string | null
      certificate_type: string
      template_id: string | null
    }[] = []

    const toUpdate: {
      id: string
      certificate_type: string
      template_id: string | null
    }[] = []

    for (const a of assignments) {
      const memberId = a.team_member_id ?? null
      const existingId = findExistingId(a.registration_id, memberId)

      if (existingId) {
        toUpdate.push({
          id: existingId,
          certificate_type: a.certificate_type,
          template_id: a.template_id ?? null,
        })
      } else {
        toInsert.push({
          event_id,
          registration_id: a.registration_id,
          team_member_id: memberId,
          certificate_type: a.certificate_type,
          template_id: a.template_id ?? null,
        })
      }
    }

    let savedCount = 0

    // Execute Inserts in bulk
    if (toInsert.length > 0) {
      const { error: insertErr } = await admin
        .from('certificate_assignments')
        .insert(toInsert)

      if (insertErr) {
        console.error('[POST /api/certificates/assignments] Insert error:', insertErr)
        return apiError(`Assignment insert failed: ${insertErr.message}`, 500)
      }
      savedCount += toInsert.length
    }

    // Execute Updates individually (or concurrently)
    if (toUpdate.length > 0) {
      const updatePromises = toUpdate.map((item) =>
        admin
          .from('certificate_assignments')
          .update({
            certificate_type: item.certificate_type,
            template_id: item.template_id,
          })
          .eq('id', item.id)
      )

      const updateResults = await Promise.all(updatePromises)
      const updateError = updateResults.find((r) => r.error)

      if (updateError?.error) {
        console.error('[POST /api/certificates/assignments] Update error:', updateError.error)
        return apiError(`Assignment update failed: ${updateError.error.message}`, 500)
      }
      savedCount += toUpdate.length
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'certificate.assignments_saved',
      targetType: 'event',
      targetId: event_id,
      eventId: event_id,
      metadata: { count: savedCount, inserted: toInsert.length, updated: toUpdate.length },
    })

    return apiSuccess({ saved: savedCount })
  } catch (err: any) {
    console.error('[POST /api/certificates/assignments]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}
