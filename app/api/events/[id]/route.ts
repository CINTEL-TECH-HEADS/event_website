import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await context.params
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('events').select('*').eq('id', id).maybeSingle()
    if (error) return apiError(error.message, 500)
    if (!data)  return apiError('Event not found', 404)
    return apiSuccess(data)
  } catch (err) {
    return apiError('Internal server error', 500)
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await context.params
    const body     = await req.json()
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('events').update(body).eq('id', id).select().single()
    if (error) return apiError(error.message, 500)
    return apiSuccess(data)
  } catch (err) {
    return apiError('Internal server error', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await context.params
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('events').update({ is_deleted: true }).eq('id', id)
    if (error) return apiError(error.message, 500)
    return apiSuccess({ message: 'Event deleted' })
  } catch (err) {
    return apiError('Internal server error', 500)
  }
}
