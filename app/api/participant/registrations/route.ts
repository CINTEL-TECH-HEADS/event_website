import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { user }, error: userError } = await sessionSupa.auth.getUser()
    if (userError || !user) return apiError('Unauthorised', 401)

    const email = user.email!.toLowerCase()

    const admin = createAdminClient()

    // Owned registrations — the account that created it, for both solo and
    // team (as leader). participant_id is the identity; leader_email is only a
    // contact field, so we key off the account, not the email.
    const { data: ownedRegs } = await admin
      .from('registrations')
      .select(`
        *,
        events(id, title, event_type, venue, starts_at, ends_at, is_published),
        members:team_members(id, full_name, email, is_leader),
        attendance(id, checked_in_at),
        certificates(id, certificate_url, generated_at)
      `)
      .eq('participant_id', user.id)
      .order('registered_at', { ascending: false })

    // Team memberships — teams this account joined (group-code model links each
    // member to their account via participant_id). Legacy rows with no account
    // link still match by email as a fallback.
    const { data: memberRegs } = await admin
      .from('team_members')
      .select(`
        registration_id,
        participant_id,
        email,
        registrations(
          *,
          events(id, title, event_type, venue, starts_at, ends_at),
          members:team_members(id, full_name, email, is_leader),
          attendance(id, checked_in_at),
          certificates(id, certificate_url, generated_at)
        )
      `)
      .or(`participant_id.eq.${user.id},email.eq.${email}`)
      .eq('is_leader', false)

    const memberRegData = (memberRegs ?? [])
      .map((m: any) => m.registrations)
      .filter(Boolean)

    // Merge and dedupe by registration id.
    const byId = new Map<string, any>()
    for (const r of [...(ownedRegs ?? []), ...memberRegData]) {
      if (r && !byId.has(r.id)) byId.set(r.id, r)
    }

    return apiSuccess(Array.from(byId.values()))
  } catch (err) {
    console.error('[GET /api/participant/registrations]', err)
    return apiError('Internal server error', 500)
  }
}