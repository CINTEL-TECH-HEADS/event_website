// app/api/participant/registrations/[id]/certificate/route.ts
// GET — the requesting participant's OWN certificate for this registration.
// Account-based: works for a solo owner, a team creator, or a team member, and
// returns the per-member certificate (team_member_id) when applicable.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in to download your certificate.', 401)

    const admin = createAdminClient()
    const lower = user.email!.toLowerCase()

    const { data: reg } = await admin
      .from('registrations')
      .select('id, event_id, registration_type, participant_id, leader_email, members:team_members(id, participant_id, email, is_leader)')
      .eq('id', id)
      .maybeSingle()
    if (!reg) return apiError('Registration not found', 404)

    const myMember = (reg.members as any[])?.find(
      (m) => m.participant_id === user.id || m.email?.toLowerCase() === lower
    )
    const isOwner = reg.participant_id === user.id || reg.leader_email?.toLowerCase() === lower
    if (!isOwner && !myMember) return apiError('Forbidden', 403)

    // Attendance is team-level (shared QR).
    const { data: attendance } = await admin
      .from('attendance')
      .select('id')
      .eq('registration_id', reg.id)
      .limit(1)
      .maybeSingle()
    if (!attendance) return apiError('No attendance recorded for this event.', 403)

    // The requester's certificate: their per-member row for a team, else the
    // registration-level row for solo.
    const teamMemberId = reg.registration_type === 'team' ? myMember?.id ?? null : null
    let certQuery = admin
      .from('certificates')
      .select('certificate_url')
      .eq('registration_id', reg.id)
      .eq('event_id', reg.event_id)
    certQuery = teamMemberId
      ? certQuery.eq('team_member_id', teamMemberId)
      : certQuery.is('team_member_id', null)
    const { data: cert } = await certQuery
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!cert) return apiError('Certificate not generated yet. Check back later.', 404)

    const { data: signed, error: signErr } = await admin
      .storage
      .from('certificates')
      .createSignedUrl(cert.certificate_url, 60 * 60 * 24 * 7)
    if (signErr || !signed) return apiError('Failed to generate download link', 500)

    return apiSuccess({ downloadUrl: signed.signedUrl, expiresIn: '7 days' })
  } catch (err) {
    console.error('[GET /api/participant/registrations/[id]/certificate]', err)
    return apiError('Internal server error', 500)
  }
}
