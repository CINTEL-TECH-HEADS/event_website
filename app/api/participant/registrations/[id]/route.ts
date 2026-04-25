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
        certificates(id, certificate_url, generated_at)
      `)
      .eq('id', id)
      .maybeSingle()

    if (!reg) return apiError('Registration not found', 404)

    const isLeader = reg.leader_email?.toLowerCase() === email.toLowerCase()
    const isMember = reg.members?.some((m: any) => m.email?.toLowerCase() === email.toLowerCase())

    if (!isLeader && !isMember) return apiError('Forbidden', 403)

    // Get fresh QR signed URL
    let qr_code_url = reg.qr_code_url
    if (reg.qr_code_url && !reg.qr_code_url.startsWith('http')) {
      const { data: signedUrl } = await admin
        .storage
        .from('qrcodes')
        .createSignedUrl(reg.qr_code_url, 60 * 60 * 24)
      qr_code_url = signedUrl?.signedUrl ?? reg.qr_code_url
    }

    return apiSuccess({ ...reg, qr_code_url, is_leader: isLeader })
  } catch (err) {
    console.error('[GET /api/participant/registrations/[id]]', err)
    return apiError('Internal server error', 500)
  }
}