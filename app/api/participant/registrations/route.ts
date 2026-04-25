import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const sessionSupa = await createSessionClient()
    const { data: { user }, error: userError } = await sessionSupa.auth.getUser()
    if (userError || !user) return apiError('Unauthorised', 401)

    const email = user.email!
    console.log('SESSION EMAIL:', email)

    const admin = createAdminClient()

    // Leader registrations
    const { data: leaderRegs } = await admin
      .from('registrations')
      .select(`
        *,
        events(id, title, event_type, venue, starts_at, ends_at, is_published),
        members:team_members(id, full_name, email, is_leader),
        attendance(id, checked_in_at),
        certificates(id, certificate_url, generated_at)
      `)
      .eq('leader_email', email.toLowerCase())
      .order('registered_at', { ascending: false })

    console.log('LEADER REGS COUNT:', leaderRegs?.length ?? 0)

    // Team member registrations
    const { data: memberRegs } = await admin
      .from('team_members')
      .select(`
        registration_id,
        registrations(
          *,
          events(id, title, event_type, venue, starts_at, ends_at),
          members:team_members(id, full_name, email, is_leader),
          attendance(id, checked_in_at),
          certificates(id, certificate_url, generated_at)
        )
      `)
      .eq('email', email.toLowerCase())
      .eq('is_leader', false)

    const memberRegData = (memberRegs ?? [])
      .map((m: any) => m.registrations)
      .filter(Boolean)

    const allRegs = [
      ...(leaderRegs ?? []),
      ...memberRegData.filter((r: any) =>
        !leaderRegs?.find((lr: any) => lr.id === r.id)
      ),
    ]

    console.log('TOTAL REGS:', allRegs.length)

    return apiSuccess(allRegs)
  } catch (err) {
    console.error('[GET /api/participant/registrations]', err)
    return apiError('Internal server error', 500)
  }
}