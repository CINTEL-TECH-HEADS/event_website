// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const { id } =
      await context.params

    const supabase =
      createAdminClient()

    const { data, error } =
      await supabase
        .from(
          'event_organizers'
        )
        .select(`
          role,
          profiles(
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', id)

    if (error)
      return apiError(
        error.message,
        500
      )

    return apiSuccess(
      data ?? []
    )
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    const { id } =
      await context.params

    const body =
      await req.json()

    const supabase =
      createAdminClient()

    const { data, error } =
      await supabase
        .from(
          'event_organizers'
        )
        .insert([
          {
            event_id: id,
            profile_id:
              body.profile_id,
            role:
              body.role ??
              'manager',
          },
        ])
        .select()
        .single()

    if (error)
      return apiError(
        error.message,
        500
      )

    return apiSuccess(data)
  } catch {
    return apiError(
      'Internal server error',
      500
    )
  }
}