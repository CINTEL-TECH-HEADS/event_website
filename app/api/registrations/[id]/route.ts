// GET /api/registrations/[id] — the confirmation page's view of a registration,
// including a signed link to its QR pass (the entry ticket). Only the account
// that registered, or a teammate linked to the registration, may read it.
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { getQrSignedUrl } from '@/lib/qr/generate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getAuthUser()
    if (!user) return apiError('Sign in to see this registration.', 401)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        display_id,
        leader_name,
        status,
        qr_code_url,
        participant_id
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) return apiError(error.message, 500)

    // Someone else's registration looks the same as a missing one.
    let allowed = !!data && data.participant_id === user.id
    if (data && !allowed) {
      const { data: member } = await supabase
        .from('team_members')
        .select('id')
        .eq('registration_id', data.id)
        .eq('participant_id', user.id)
        .limit(1)
        .maybeSingle()
      allowed = !!member
    }
    if (!data || !allowed) return apiError('Registration not found', 404)

    let qrUrl = null

    if (data.qr_code_url) {
      try {
        qrUrl = await getQrSignedUrl(data.qr_code_url)
      } catch {
        qrUrl = null
      }
    }

    return apiSuccess({
      id: data.id,
      display_id: data.display_id,
      leader_name: data.leader_name,
      status: data.status,
      qr_code_url: qrUrl,
    })
  } catch {
    return apiError(
      'Unable to load confirmation details.',
      500
    )
  }
}
