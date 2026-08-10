import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sessionSupa = await createSessionClient()
    const { data: { user }, error: userError } = await sessionSupa.auth.getUser()
    if (userError || !user) return apiError('Unauthorised', 401)

    const email = user.email!
    const admin = createAdminClient()

    const { data: reg } = await admin
      .from('registrations')
      .select(`
        *,
        events(*),
        members:team_members(*),
        answers:registration_answers(*, form_fields(label, field_type)),
        attendance(id, checked_in_at, method),
        certificates(id, certificate_url, generated_at, team_member_id),
        payment_submissions(id, method, transaction_id, payer_upi_id, payee_name, amount, screenshot_path, status, note, created_at)
      `)
      .eq('id', id)
      .maybeSingle()

    if (!reg) return apiError('Registration not found', 404)

    // Access + role are account-based (participant_id), with email as a legacy
    // fallback. Owner = solo participant or team creator; member = joined the team.
    const lowerEmail = email.toLowerCase()
    const myMember = reg.members?.find(
      (m: any) => m.participant_id === user.id || m.email?.toLowerCase() === lowerEmail
    )
    const isOwner =
      reg.participant_id === user.id || reg.leader_email?.toLowerCase() === lowerEmail
    const isLeader = isOwner || !!myMember?.is_leader

    if (!isOwner && !myMember) return apiError('Forbidden', 403)

    // Get fresh QR signed URL
    let qr_code_url = reg.qr_code_url
    if (reg.qr_code_url && !reg.qr_code_url.startsWith('http')) {
      const { data: signedUrl } = await admin
        .storage
        .from('qrcodes')
        .createSignedUrl(reg.qr_code_url, 60 * 60 * 24)
      qr_code_url = signedUrl?.signedUrl ?? reg.qr_code_url
    }

    // Team contacts: once the team is confirmed (free) or paid, share each
    // member's phone (from their participant profile) so members can reach each
    // other. Kept hidden before confirmation to avoid leaking contact details.
    const contactsUnlocked =
      reg.status === 'confirmed' &&
      (reg.payment_status === 'paid' || reg.payment_status === 'not_required')
    if (contactsUnlocked && Array.isArray(reg.members) && reg.members.length > 0) {
      const ids = reg.members.map((m: any) => m.participant_id).filter(Boolean)
      if (ids.length > 0) {
        const { data: profiles } = await admin
          .from('participant_profiles')
          .select('id, phone')
          .in('id', ids)
        const phoneById = new Map((profiles ?? []).map((p: any) => [p.id, p.phone]))
        reg.members = reg.members.map((m: any) => ({
          ...m,
          phone: m.participant_id ? phoneById.get(m.participant_id) ?? null : null,
        }))
      }
    }

    // The certificate belonging to the requesting member: for a team, the row
    // whose team_member_id matches; for solo, the registration-level row.
    const myCertificate = myMember
      ? (reg.certificates ?? []).find((c: any) => c.team_member_id === myMember.id) ?? null
      : (reg.certificates ?? []).find((c: any) => !c.team_member_id) ?? null

    return apiSuccess({
      ...reg,
      qr_code_url,
      is_leader: isLeader,
      my_team_member_id: myMember?.id ?? null,
      my_certificate: myCertificate,
    })
  } catch (err) {
    console.error('[GET /api/participant/registrations/[id]]', err)
    return apiError('Internal server error', 500)
  }
}