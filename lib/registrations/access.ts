// lib/registrations/access.ts
//
// Account-based authorization for a team registration. The creator owns the
// team (registration.participant_id, or the is_leader team_members row linked to
// their account). Email is a legacy fallback for pre-account rows.

import type { SupabaseClient } from '@supabase/supabase-js'

export async function isTeamCreator(
  admin: SupabaseClient,
  registrationId: string,
  userId: string,
  email: string
): Promise<boolean> {
  const lower = email.toLowerCase()

  const { data: reg } = await admin
    .from('registrations')
    .select('id, participant_id, leader_email, members:team_members(participant_id, email, is_leader)')
    .eq('id', registrationId)
    .maybeSingle()

  if (!reg) return false
  if (reg.participant_id === userId) return true
  if (reg.leader_email?.toLowerCase() === lower) return true

  return !!(reg.members as any[])?.some(
    (m) => m.is_leader && (m.participant_id === userId || m.email?.toLowerCase() === lower)
  )
}

// Once a team's payment is verified (payment_status='paid') the roster is
// frozen — no rename, open/close, add, or remove. Returns true if locked.
export async function isTeamLocked(
  admin: SupabaseClient,
  registrationId: string
): Promise<boolean> {
  const { data } = await admin
    .from('registrations')
    .select('payment_status')
    .eq('id', registrationId)
    .maybeSingle()
  return data?.payment_status === 'paid'
}
