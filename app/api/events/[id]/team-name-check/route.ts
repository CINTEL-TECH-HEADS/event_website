// app/api/events/[id]/team-name-check/route.ts
// GET ?name=Foo → { available, suggestion }. Live availability for team names
// (unique per event, case-insensitive). Requires login.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { isTeamNameTaken, suggestTeamName } from '@/lib/registrations/team-name'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const name = (req.nextUrl.searchParams.get('name') ?? '').trim()

  const user = await getAuthUser()
  if (!user) return apiError('Unauthorised', 401)
  if (name.length < 2) return apiSuccess({ available: false, suggestion: null })

  const admin = createAdminClient()
  const taken = await isTeamNameTaken(admin, eventId, name)
  return apiSuccess({
    available: !taken,
    suggestion: taken ? await suggestTeamName(admin, eventId, name) : null,
  })
}
