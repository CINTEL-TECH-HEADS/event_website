// app/api/audit/route.ts
// GET /api/audit — read the organizer action log. Superadmins only.
// Filters: ?event_id= ?action= ?email= ?limit= (default 100, max 500)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { getAuthUser } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return apiError('Not authenticated', 401)

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'superadmin') {
      return apiError('This log is restricted to superadmins.', 403)
    }

    const { searchParams } = req.nextUrl
    const eventId = searchParams.get('event_id')
    const action = searchParams.get('action')
    const email = searchParams.get('email')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100), 1), 500)

    let query = admin
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventId) query = query.eq('event_id', eventId)
    if (action) query = query.eq('action', action)
    if (email) query = query.ilike('actor_email', `%${email}%`)

    const { data, error } = await query
    if (error) return apiError(error.message, 500)

    return apiSuccess(data ?? [])
  } catch (err) {
    console.error('[GET /api/audit]', err)
    return apiError('Internal server error', 500)
  }
}
