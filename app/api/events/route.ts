// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import {
  createAdminClient,
  createSessionClient,
} from '@/lib/supabase/server'

export async function GET(
  req: NextRequest
) {
  try {
    const supabase =
      createAdminClient()

    const mine =
      req.nextUrl.searchParams.get(
        'mine'
      )

    const slug =
      req.nextUrl.searchParams.get(
        'slug'
      )

    // Organizer dashboard events
    if (mine === 'true') {
      try {
        const sessionSupa =
          await createSessionClient()

        const {
          data: { user },
        } =
          await sessionSupa.auth.getUser()

        if (!user) {
          console.log('No user found')
          return apiError(
            'Unauthorized',
            401
          )
        }

        const userId = user?.id
        if (!userId) {
          console.log('No user ID')
          return apiError(
            'User ID not found',
            401
          )
        }

        console.log('Fetching events for user:', userId)

        const { data, error } =
          await supabase
            .from(
              'event_organizers'
            )
            .select(`
              events(
                id,
                title,
                venue,
                is_published,
                registrations(count)
              )
            `)
            .eq(
              'profile_id',
              userId
            )

        if (error) {
          console.error('DB error:', error)
          return apiSuccess([])
        }

        const events =
          data?.flatMap(
            (item: any) =>
              item.events ? [{
                ...item.events,
                confirmed_count:
                  item.events
                    ?.registrations?.[0]
                    ?.count ?? 0,
              }] : []
          ) || []

        console.log('Events found:', events.length)
        return apiSuccess(events)
      } catch (err) {
        console.error('Session error:', err)
        return apiError(
          'Failed to fetch session',
          401
        )
      }
    }

    // Single event page
    if (slug) {
      const { data, error } =
        await supabase
          .from('events')
          .select(
            '*, form_fields(*)'
          )
          .eq('slug', slug)
          .eq(
            'is_published',
            true
          )
          .eq(
            'is_deleted',
            false
          )
          .maybeSingle()

      if (error)
        return apiError(
          error.message,
          500
        )

      if (!data)
        return apiError(
          'Event not found',
          404
        )

      return apiSuccess(data)
    }

    // Public events list
    const { data, error } =
      await supabase
        .from('events')
        .select(`
          id,
          title,
          slug,
          event_type,
          venue,
          starts_at,
          ends_at,
          capacity,
          registration_mode,
          is_published
        `)
        .eq(
          'is_published',
          true
        )
        .eq(
          'is_deleted',
          false
        )
        .order(
          'starts_at',
          {
            ascending: true,
          }
        )

    if (error)
      return apiError(
        error.message,
        500
      )

    return apiSuccess(
      data ?? []
    )
  } catch (err) {
    console.error('GET /api/events error:', err)
    return apiError(
      'Internal server error',
      500
    )
  }
}

export async function POST(
  req: NextRequest
) {
  const sessionSupa =
    await createSessionClient()

  const {
    data: { user },
  } =
    await sessionSupa.auth.getUser()

  if (!user)
    return apiError(
      'Unauthorized',
      401
    )

  try {
    const payload =
      await req.json()

    const supabase =
      createAdminClient()

    const slug =
      payload.title
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /(^-|-$)+/g,
          ''
        )

    const {
      data: event,
      error:
        eventError,
    } =
      await supabase
        .from('events')
        .insert([
          {
            title:
              payload.title,
            slug,
            description:
              payload.description,
            event_type:
              payload.event_type,
            venue:
              payload.venue,
            starts_at:
              new Date(
                payload.starts_at
              ).toISOString(),
            ends_at:
              new Date(
                payload.ends_at
              ).toISOString(),
            registration_closes_at:
              new Date(
                payload.registration_closes_at
              ).toISOString(),
            capacity:
              payload.capacity,
            registration_mode:
              payload.registration_mode,
            min_team_size:
              payload.min_team_size ??
              null,
            max_team_size:
              payload.max_team_size ??
              null,
            is_published:
              false,
          },
        ])
        .select()
        .single()

    if (eventError)
      return apiError(
        eventError.message,
        500
      )

    const {
      error: orgError,
    } =
      await supabase
        .from(
          'event_organizers'
        )
        .insert([
          {
            event_id:
              event.id,
            profile_id:
              session.user.id,
            role: 'owner',
          },
        ])

    if (orgError)
      return apiError(
        orgError.message,
        500
      )

    return apiSuccess(
      event
    )
  } catch (
    err: any
  ) {
    return apiError(
      err.message ||
        'Malformed payload',
      400
    )
  }
}