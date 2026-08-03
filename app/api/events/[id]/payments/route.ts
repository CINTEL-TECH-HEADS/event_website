// app/api/events/[id]/payments/route.ts
// GET — payments for an event. STUB for now (real payment tracking pending):
// returns an empty list. Authorized to organizers so it's ready to fill in later.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  // TODO: return real payment records once the payment gateway is integrated.
  return apiSuccess([])
}
