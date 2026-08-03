// app/api/verify/[assignmentId]/route.ts
//
// PUBLIC verification endpoint — no authentication required.
//
// Resolves a certificate assignment and verifies whether the certificate has been released.
// Returns details for the public verification page.
// Supports direct assignment UUID, composite (registration_id-team_member_id), or registration_id.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params

    if (!assignmentId) {
      return NextResponse.json(
        { data: { status: 'not_found', valid: false }, error: 'Missing assignmentId' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    let assignment: any = null

    // 1. Direct UUID lookup on certificate_assignments.id
    if (UUID_REGEX.test(assignmentId)) {
      const { data } = await admin
        .from('certificate_assignments')
        .select(`
          id,
          certificate_type,
          team_member_id,
          registration_id,
          created_at,
          registrations!inner (
            id,
            registration_type,
            team_name,
            leader_name,
            events!inner (
              id,
              title,
              certificates_released_at,
              starts_at
            )
          )
        `)
        .eq('id', assignmentId)
        .maybeSingle()

      assignment = data
    }

    // 2. If not found by primary key ID, attempt composite lookup (regId-memberId or regId)
    if (!assignment) {
      const parts = assignmentId.split('-')
      let regId: string | null = null
      let memberId: string | null = null

      if (parts.length === 10) {
        // Two 5-part UUIDs joined by a dash: 8-4-4-4-12 - 8-4-4-4-12
        regId = parts.slice(0, 5).join('-')
        memberId = parts.slice(5, 10).join('-')
      } else if (UUID_REGEX.test(assignmentId)) {
        regId = assignmentId
      }

      if (regId) {
        let q = admin
          .from('certificate_assignments')
          .select(`
            id,
            certificate_type,
            team_member_id,
            registration_id,
            created_at,
            registrations!inner (
              id,
              registration_type,
              team_name,
              leader_name,
              events!inner (
                id,
                title,
                certificates_released_at,
                starts_at
              )
            )
          `)
          .eq('registration_id', regId)

        q = memberId ? q.eq('team_member_id', memberId) : q.is('team_member_id', null)
        const { data } = await q.maybeSingle()
        assignment = data
      }
    }

    // 3. Fallback: If still no row in certificate_assignments, check registrations table directly
    if (!assignment) {
      const parts = assignmentId.split('-')
      let regId = assignmentId
      let memberId: string | null = null
      if (parts.length === 10) {
        regId = parts.slice(0, 5).join('-')
        memberId = parts.slice(5, 10).join('-')
      }

      if (UUID_REGEX.test(regId)) {
        const { data: reg } = await admin
          .from('registrations')
          .select(`
            id,
            registration_type,
            team_name,
            leader_name,
            events!inner (
              id,
              title,
              certificates_released_at,
              starts_at
            )
          `)
          .eq('id', regId)
          .maybeSingle()

        if (reg) {
          assignment = {
            id: assignmentId,
            certificate_type: 'Participation',
            team_member_id: memberId,
            registration_id: reg.id,
            created_at: new Date().toISOString(),
            registrations: reg,
          }
        }
      }
    }

    if (!assignment) {
      return NextResponse.json(
        { data: { status: 'not_found', valid: false }, error: 'Certificate assignment not found or invalid' },
        { status: 404 }
      )
    }

    const reg = assignment.registrations as any
    const event = reg?.events as any

    // ── Check if certificates have been released by organizer ──
    if (!event?.certificates_released_at) {
      return NextResponse.json(
        {
          data: {
            status: 'unreleased',
            valid: false,
            eventName: event?.title ?? 'CINTEL Event',
          },
          error: 'Certificates have not been released yet.',
        },
        { status: 403 }
      )
    }

    // Determine participant name (member full_name or leader_name)
    let participantName: string = reg?.leader_name ?? 'Participant'

    if (assignment.team_member_id) {
      const { data: member } = await admin
        .from('team_members')
        .select('full_name')
        .eq('id', assignment.team_member_id)
        .maybeSingle()

      if (member?.full_name) {
        participantName = member.full_name
      }
    }

    const teamName: string | null =
      reg?.registration_type === 'team' ? (reg?.team_name ?? null) : null

    const rawIssueDate = event.certificates_released_at || assignment.created_at
    const issueDate = new Date(rawIssueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return NextResponse.json(
      {
        data: {
          status: 'verified',
          valid: true,
          participantName,
          eventName: event?.title ?? 'CINTEL Event',
          certificateType: assignment.certificate_type ?? 'Participation',
          registrationType: reg?.registration_type ?? 'solo',
          teamName,
          issueDate,
          assignmentId: assignment.id,
        },
        error: null,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[GET /api/verify/[assignmentId]] Unexpected error:', err)
    return NextResponse.json(
      {
        data: { status: 'unavailable', valid: false },
        error: 'Verification service currently unavailable. Please try again later.',
      },
      { status: 500 }
    )
  }
}
