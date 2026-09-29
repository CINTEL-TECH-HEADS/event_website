// Owner: BE2
// GET /api/events/[id]/registrations — fetch registrations for dashboard table
// Supports: ?status=confirmed|waitlisted|cancelled  ?search=name/email  ?type=solo|team
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminClient()
  const { id: eventId } = await params

  // Registrations contain attendee PII — organizers/judges only
  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) {
    return apiError(auth.error, auth.status)
  }

  const status = req.nextUrl.searchParams.get('status')
  const search = req.nextUrl.searchParams.get('search')
  const type = req.nextUrl.searchParams.get('type')

  let query = supabase
    .from('registrations')
    .select(`
      *,
      members:team_members(id, full_name, email, is_leader, checked_in_at),
      answers:registration_answers(id, answer, field_id, form_fields(label, field_type)),
      attendance(id, checked_in_at, method, checked_in_by),
      certificates(id, certificate_url)
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('registration_type', type)

  if (search) {
    query = query.or(
      `leader_name.ilike.%${search}%,leader_email.ilike.%${search}%,display_id.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) return apiError(error.message, 500)

  return apiSuccess(data ?? [])
}