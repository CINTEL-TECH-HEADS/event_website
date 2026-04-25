// Owner: BE2
// POST /api/registrations/[id]/cancel — cancel registration + trigger waitlist promotion

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminClient()
  const { id } = await params


  const table: any = supabase.from('registrations')

  const { data: registration, error: fetchError } = await table
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !registration) {
    return apiError('Registration not found', 404)
  }

 
  const { error: cancelError } = await table
    .update({
      status: 'cancelled',
    })
    .eq('id', id)

  if (cancelError) {
    return apiError(cancelError.message, 500)
  }

 
  const { data: nextWaitlisted, error: waitlistError } = await table
    .select('*')
    .eq('event_id', registration.event_id)
    .eq('status', 'waitlisted')
    .order('registered_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!waitlistError && nextWaitlisted) {
    await table
      .update({
        status: 'confirmed',
      })
      .eq('id', nextWaitlisted.id)
  }


  return apiSuccess({
    message: 'Registration cancelled',
    waitlist_promoted: !!nextWaitlisted,
  })
}