// app/api/registrations/mine/route.ts
//
// GET /api/registrations/mine?event_id=<uuid>
// → { registered: boolean, registration_id: string | null }
// Lets the public event/register pages hide the register CTA when the logged-in
// user is already registered. Not authenticated → { registered: false }.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'
import { findUserRegistration } from '@/lib/registrations/is-registered'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return apiError('event_id is required', 400)

  const user = await getAuthUser()
  if (!user) return apiSuccess({ registered: false, registration_id: null })

  const admin = createAdminClient()
  const existing = await findUserRegistration(admin, eventId, user.id, user.email!)

  return apiSuccess({
    registered: !!existing,
    registration_id: existing?.id ?? null,
  })
}
