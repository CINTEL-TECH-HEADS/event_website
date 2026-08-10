// app/api/participant/registrations/[id]/payment/route.ts
// POST — participant submits payment proof for a paid registration.
//   Body: { method, transaction_id, payer_upi_id?, payee_name?, screenshot_path }
//   UPI  → transaction_id (UTR) + payer_upi_id (VPA) required.
//   Bank → transaction_id (UTR) + payee_name (account holder) required.
// Records a payment_submissions row (status 'submitted') and moves the
// registration to payment_status='submitted'. An organizer verifies it later.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in.', 401)

    const body = await req.json()
    const method = body.method as 'upi' | 'bank'
    const transaction_id = (body.transaction_id ?? '').trim()
    const payer_upi_id = (body.payer_upi_id ?? '').trim()
    const payee_name = (body.payee_name ?? '').trim()
    const screenshot_path = (body.screenshot_path ?? '').trim()

    const admin = createAdminClient()
    const { data: reg } = await admin
      .from('registrations')
      .select('id, event_id, participant_id, registration_type, payment_status, events(fee, payment_method, min_team_size)')
      .eq('id', id)
      .maybeSingle()
    if (!reg) return apiError('Registration not found', 404)
    if (reg.participant_id !== user.id) return apiError('Forbidden', 403)

    const event = reg.events as any
    const fee = event?.fee ?? 0
    if (fee <= 0) return apiError('This event does not require payment.')
    if (reg.payment_status === 'paid') return apiError('This registration is already paid.')

    // Method must match the event's active method.
    if (method !== 'upi' && method !== 'bank') return apiError('Invalid payment method.')
    if (event?.payment_method && method !== event.payment_method) {
      return apiError('This event is not accepting that payment method.')
    }

    // Team leader can only pay once the team has reached the minimum size.
    if (reg.registration_type === 'team') {
      const { count } = await admin
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('registration_id', reg.id)
      const minSize = event?.min_team_size ?? 1
      if ((count ?? 0) < minSize) {
        return apiError(`Your team needs at least ${minSize} members before you can pay.`)
      }
    }

    // Required proof fields per method.
    if (!screenshot_path) return apiError('A payment screenshot is required.')
    if (!transaction_id) return apiError('The transaction / UTR number is required.')
    if (method === 'upi' && !payer_upi_id) return apiError('Your UPI ID (VPA) is required.')
    if (method === 'bank' && !payee_name) return apiError('The account-holder name is required.')

    const { error: insErr } = await admin.from('payment_submissions').insert({
      registration_id: reg.id,
      event_id: reg.event_id,
      method,
      payer_upi_id: method === 'upi' ? payer_upi_id : null,
      transaction_id,
      payee_name: method === 'bank' ? payee_name : null,
      amount: fee,
      screenshot_path,
      status: 'submitted',
    })
    if (insErr) return apiError(insErr.message, 500)

    const { error: updErr } = await admin
      .from('registrations')
      .update({ payment_status: 'submitted' })
      .eq('id', reg.id)
    if (updErr) return apiError(updErr.message, 500)

    return apiSuccess({ submitted: true })
  } catch (err) {
    console.error('[POST /api/participant/registrations/[id]/payment]', err)
    return apiError('Internal server error', 500)
  }
}
