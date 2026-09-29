// app/api/events/[id]/post-certificates/route.ts
//
// POST /api/events/[id]/post-certificates
//
// Organizer endpoint — updates events.certificates_released_at to release
// certificates to all participants in their portal and enable public QR verification.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { logAction } from '@/lib/audit/log'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return apiError('Event ID is required', 400)

    const auth = await requireOrganizerRole(id, ['owner', 'sub_admin'])
    if ('error' in auth) return apiError(auth.error, auth.status)

    const admin = createAdminClient()
    const now = new Date().toISOString()

    // 1. Fetch checked-in registrations (and confirmed registrations) to auto-populate assignments if missing
    const { data: attendedRows } = await admin
      .from('attendance')
      .select(`
        registration_id,
        registrations!inner (
          id, registration_type, status,
          members:team_members ( id, checked_in_at )
        )
      `)
      .eq('event_id', id)

    // Build target list of (registration_id, team_member_id)
    const targets: { registration_id: string; team_member_id: string | null }[] = []
    for (const row of attendedRows ?? []) {
      const reg = row.registrations as any
      if (!reg || reg.status !== 'confirmed') continue
      if (reg.registration_type === 'team') {
        // Only members marked present at check-in.
        for (const m of (reg.members ?? []).filter((x: any) => x.checked_in_at)) {
          targets.push({ registration_id: reg.id, team_member_id: m.id })
        }
      } else {
        targets.push({ registration_id: reg.id, team_member_id: null })
      }
    }

    // 2. Fetch existing assignments for this event
    const { data: existingAssignments } = await admin
      .from('certificate_assignments')
      .select('registration_id, team_member_id')
      .eq('event_id', id)

    const existingSet = new Set(
      (existingAssignments ?? []).map(
        (a: any) => `${a.registration_id}:${a.team_member_id ?? 'null'}`
      )
    )

    // Filter missing targets
    const missingTargets = targets.filter(
      (t) => !existingSet.has(`${t.registration_id}:${t.team_member_id ?? 'null'}`)
    )

    if (missingTargets.length > 0) {
      const newAssignments = missingTargets.map((t) => ({
        event_id: id,
        registration_id: t.registration_id,
        team_member_id: t.team_member_id,
        certificate_type: 'Participation',
      }))

      // Plain insert: these targets have no assignment yet. (An upsert can't be
      // used here — the table's unique indexes are partial, so ON CONFLICT on
      // these columns always failed and no assignments were ever created.)
      const { error: assignErr } = await admin
        .from('certificate_assignments')
        .insert(newAssignments)
      if (assignErr) return apiError(`Failed to assign certificates: ${assignErr.message}`, 500)
    }

    // 3. Update event certificates_released_at
    const { data: updatedEvent, error: updateErr } = await admin
      .from('events')
      .update({ certificates_released_at: now })
      .eq('id', id)
      .select('id, title, certificates_released_at')
      .single()

    if (updateErr) {
      console.error('[POST /api/events/[id]/post-certificates] Update error:', updateErr)
      return apiError(`Failed to release certificates: ${updateErr.message}`, 500)
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'certificate.post_certificates',
      targetType: 'event',
      targetId: id,
      eventId: id,
      metadata: { certificates_released_at: now, auto_assigned: missingTargets.length },
    })

    return apiSuccess({
      message: 'Certificates successfully posted and released to participants!',
      released_at: now,
      event: updatedEvent,
      total_assigned: targets.length,
    })
  } catch (err: any) {
    console.error('[POST /api/events/[id]/post-certificates]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}
