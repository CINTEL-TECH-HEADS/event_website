// lib/registrations/is-registered.ts
//
// Is the given account already registered for an event? An account owns a
// registration via participant_id (solo, or team leader); a participant can
// also be on a team as a non-leader member (matched by email). Either counts
// as "already registered". Shared by POST /api/registrations (server guard)
// and GET /api/registrations/mine (UI gate).

import type { SupabaseClient } from '@supabase/supabase-js'

export async function findUserRegistration(
  admin: SupabaseClient,
  eventId: string,
  userId: string,
  email: string
): Promise<{ id: string } | null> {
  const normalizedEmail = email.toLowerCase()

  // Owned registration for this event.
  const { data: owned } = await admin
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('participant_id', userId)
    .limit(1)
    .maybeSingle()
  if (owned) return { id: owned.id }

  // Membership on a team registered for this event.
  const { data: member } = await admin
    .from('team_members')
    .select('registration_id, registrations!inner(id, event_id)')
    .eq('email', normalizedEmail)
    .eq('registrations.event_id', eventId)
    .limit(1)
    .maybeSingle()
  if (member) return { id: (member as any).registration_id }

  return null
}
