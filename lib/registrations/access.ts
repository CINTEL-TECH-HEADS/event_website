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

// Authoritative "does this user own this registration" check — the single
// source of truth used by the pay page's access gate and every owner-only
// action (payment, offer, simulate). A registration is owned by the account
// linked as participant_id, or — as the reliable fallback — by whoever the
// leader_email belongs to. leader_email is derived at registration time from
// the profile's college/personal email (falling back to the auth email), so we
// match against all of the user's known emails, not just the auth one. This is
// what makes solo registrations resolvable even when participant_id is unset.
export async function isRegistrationOwner(
  admin: SupabaseClient,
  reg: { participant_id: string | null; leader_email: string | null },
  user: { id: string; email?: string | null }
): Promise<boolean> {
  if (reg.participant_id && reg.participant_id === user.id) return true
  const leader = reg.leader_email?.toLowerCase()
  if (!leader) return false
  if (user.email && leader === user.email.toLowerCase()) return true
  const { data: p } = await admin
    .from('participant_profiles')
    .select('college_email, personal_email')
    .eq('id', user.id)
    .maybeSingle()
  return [p?.college_email, p?.personal_email].some(
    (e) => e && e.toLowerCase() === leader
  )
}

// Self-heal: once a user is confirmed as owner via email (participant_id was
// null), backfill the account link so future actions resolve by participant_id.
// Fire-and-forget — a failure here never blocks the action.
export async function linkParticipantIfUnset(
  admin: SupabaseClient,
  reg: { id: string; participant_id: string | null },
  userId: string
): Promise<void> {
  if (reg.participant_id) return
  await admin.from('registrations').update({ participant_id: userId }).eq('id', reg.id)
}
