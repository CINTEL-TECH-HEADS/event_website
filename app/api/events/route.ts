// Owner: BE2
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import {
  createAdminClient,
  createSessionClient,
} from '@/lib/supabase/server'
import { logAction } from '@/lib/audit/log'
import { getAuthUser } from '@/lib/auth/get-session'
import { isExternalParticipant } from '@/lib/participants/identity'

// The list depends on who is asking.
export const dynamic = 'force-dynamic'

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

        // Organizers and superadmins see EVERY event (kept in sync with the
        // full events list); other roles (e.g. judges) see only their assigned events.
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        const isGlobalOrganizer =
          profile?.role === 'organizer' || profile?.role === 'superadmin'

        if (isGlobalOrganizer) {
          const { data, error } = await supabase
            .from('events')
            .select('id, title, venue, starts_at, ends_at, is_published, registrations(count)')
            .eq('is_deleted', false)
            .order('starts_at', { ascending: false })

          if (error) {
            console.error('DB error:', error)
            return apiSuccess([])
          }

          const events = (data ?? []).map((e: any) => ({
            id: e.id,
            title: e.title,
            venue: e.venue,
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            is_published: e.is_published,
            confirmed_count: e.registrations?.[0]?.count ?? 0,
          }))
          return apiSuccess(events)
        }

        const { data, error } =
          await supabase
            .from(
              'event_organizers'
            )
            .select(`
              role,
              events(
                id,
                title,
                venue,
                starts_at,
                ends_at,
                is_published,
                is_deleted,
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
              item.events && !item.events.is_deleted ? [{
                ...item.events,
                // Their role on this event: judges get the read-only judge view.
                my_role: item.role,
                confirmed_count:
                  item.events
                    ?.registrations?.[0]
                    ?.count ?? 0,
              }] : []
          ) || []

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

    // Public events list. Students from other colleges only see events that
    // are open to them; everyone else (including signed-out visitors) sees all.
    const viewer = await getAuthUser()
    const external = await isExternalParticipant(supabase, viewer?.id)

    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        slug,
        event_type,
        venue,
        starts_at,
        ends_at,
        registration_closes_at,
        capacity,
        registration_mode,
        open_to_external,
        banner_url,
        is_published
      `)
      .eq('is_published', true)
      .eq('is_deleted', false)
    if (external) query = query.eq('open_to_external', true)

    const { data, error } = await query.order('starts_at', { ascending: true })

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

    // Team-size cap: required and 2 <= min <= max for team/both; null for solo.
    const isTeamMode = payload.registration_mode !== 'solo'
    let minTeam: number | null = null
    let maxTeam: number | null = null
    if (isTeamMode) {
      minTeam = payload.min_team_size ?? null
      maxTeam = payload.max_team_size ?? null
      if (minTeam == null || maxTeam == null) {
        return apiError('Team and both events require a min and max team size', 400)
      }
      if (minTeam < 2 || maxTeam < 2) {
        return apiError('Team size must be at least 2', 400)
      }
      if (minTeam > maxTeam) {
        return apiError('Max team size must be greater than or equal to min team size', 400)
      }
    }

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
              minTeam,
            max_team_size:
              maxTeam,
            waitlist_capacity:
              payload.waitlist_capacity ?? null,
            fee:
              payload.fee ?? 0,
            open_to_external:
              payload.open_to_external === true,
            payment_method:
              payload.fee > 0 ? (payload.payment_method ?? null) : null,
            upi_id:
              payload.upi_id ?? null,
            upi_payee_name:
              payload.upi_payee_name ?? null,
            bank_account_name:
              payload.bank_account_name ?? null,
            bank_account_number:
              payload.bank_account_number ?? null,
            bank_ifsc:
              payload.bank_ifsc ?? null,
            bank_name:
              payload.bank_name ?? null,
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
              user.id,
            role: 'owner',
          },
        ])

    if (orgError)
      return apiError(
        orgError.message,
        500
      )

    await logAction({
      actorId: user.id,
      actorEmail: user.email,
      action: 'event.create',
      targetType: 'event',
      targetId: event.id,
      eventId: event.id,
      metadata: { title: event.title },
    })

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