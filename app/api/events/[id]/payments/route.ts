// app/api/events/[id]/payments/route.ts
// GET — payment submissions for an event, so an organizer can verify each
// transaction and grant the pass. Returns each payment-relevant registration
// joined to its latest submission. Auth: organizers of the event.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const auth = await requireOrganizerRole(eventId, ['owner', 'sub_admin', 'judge'])
  if ('error' in auth) return apiError(auth.error, auth.status)

  const admin = createAdminClient()

  // Paid-relevant registrations for this event (anything past 'not_required').
  const { data: regs, error } = await admin
    .from('registrations')
    .select('id, display_id, team_name, leader_name, leader_email, registration_type, status, payment_status, registered_at')
    .eq('event_id', eventId)
    .in('payment_status', ['pending', 'submitted', 'paid', 'rejected'])
    .order('registered_at', { ascending: false })
  if (error) return apiError(error.message, 500)

  const regList = regs ?? []
  if (regList.length === 0) return apiSuccess([])

  // Latest submission per registration.
  const { data: subs } = await admin
    .from('payment_submissions')
    .select('id, registration_id, method, payer_upi_id, transaction_id, payee_name, amount, screenshot_path, status, note, reviewed_at, created_at')
    .in('registration_id', regList.map((r) => r.id))
    .order('created_at', { ascending: false })

  const latestByReg = new Map<string, any>()
  for (const s of subs ?? []) {
    if (!latestByReg.has(s.registration_id)) latestByReg.set(s.registration_id, s)
  }

  const rows = regList.map((r) => ({
    ...r,
    submission: latestByReg.get(r.id) ?? null,
  }))

  return apiSuccess(rows)
}
