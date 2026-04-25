// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireOrganizerRole(params.id, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('event_organizers')
    .select(`
      id,
      event_id,
      role,
      profile:profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('event_id', params.id)

  if (error) return apiError(error.message, 500)
  return apiSuccess(data)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireOrganizerRole(params.id, ['owner'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  try {
    const { email, role } = await req.json()
    const supabase = createAdminClient()

    // Find profile by email (case insensitive)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email.trim())
      .single()

    if (profileError || !profileData) {
      return apiError('User not found. They must create an account first.', 404)
    }

    const { error } = await supabase
      .from('event_organizers')
      .insert({
        event_id: params.id,
        profile_id: profileData.id,
        role: role
      })

    if (error) {
      if (error.code === '23505') {
        return apiError('User is already assigned to this event.', 400)
      }
      return apiError(error.message, 500)
    }

    const { data: allData } = await supabase
      .from('event_organizers')
      .select(`
        id,
        event_id,
        role,
        profile:profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('event_id', params.id)

    return apiSuccess(allData)
  } catch (err: any) {
    return apiError(err.message || 'Payload error', 400)
  }
}
