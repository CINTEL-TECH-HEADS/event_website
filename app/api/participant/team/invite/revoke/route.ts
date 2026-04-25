// app/api/participant/team/invite/revoke/route.ts
// POST — revoke an active invite code

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { session } } = await sessionSupa.auth.getSession()
    if (!session) return apiError('Unauthorised', 401)

    const { code } = await req.json()
    const email    = session.user.email!
    const admin    = createAdminClient()

    const { error } = await admin
      .from('team_invite_codes')
      .update({ is_revoked: true })
      .eq('code', code)
      .eq('created_by_email', email)

    if (error) return apiError(error.message, 500)

    return apiSuccess({ message: 'Invite code revoked' })
  } catch (err) {
    console.error('[POST /api/participant/team/invite/revoke]', err)
    return apiError('Internal server error', 500)
  }
}
