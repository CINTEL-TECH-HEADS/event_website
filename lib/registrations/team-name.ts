// lib/registrations/team-name.ts
// Team-name uniqueness helpers (per event, case-insensitive).

import type { SupabaseClient } from '@supabase/supabase-js'

export async function isTeamNameTaken(
  admin: SupabaseClient,
  eventId: string,
  name: string,
  excludeRegistrationId?: string
): Promise<boolean> {
  const trimmed = name.trim()
  if (!trimmed) return false
  let q = admin
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('registration_type', 'team')
    .ilike('team_name', trimmed) // case-insensitive exact (no wildcards)
  if (excludeRegistrationId) q = q.neq('id', excludeRegistrationId)
  const { data } = await q.limit(1).maybeSingle()
  return !!data
}

// Return the base name if free, else "<base> 2", "<base> 3", … until available.
export async function suggestTeamName(
  admin: SupabaseClient,
  eventId: string,
  base: string
): Promise<string> {
  const clean = base.trim() || 'Team'
  if (!(await isTeamNameTaken(admin, eventId, clean))) return clean
  for (let i = 2; i < 100; i++) {
    const candidate = `${clean} ${i}`
    if (!(await isTeamNameTaken(admin, eventId, candidate))) return candidate
  }
  return `${clean} ${Date.now().toString(36)}`
}
