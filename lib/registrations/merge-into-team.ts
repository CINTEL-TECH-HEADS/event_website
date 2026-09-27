// lib/registrations/merge-into-team.ts
//
// Accepting an invite/request merges a seeker (an open team-of-one) into a team:
// the seeker becomes a member of the team and their team-of-one registration is
// dissolved so they aren't double-counted. Capacity is re-checked here (the
// authoritative point), and the seeker's other pending matches are cancelled.

import type { SupabaseClient } from '@supabase/supabase-js'
import { poolOf, teamPoolMessage } from '@/lib/participants/identity'

export async function mergeSeekerIntoTeam(
  admin: SupabaseClient,
  teamRegId: string,
  seekerParticipantId: string,
  seekerRegId: string
): Promise<{ error?: string; teamName?: string | null }> {
  // Load the target team + event capacity.
  const { data: team } = await admin
    .from('registrations')
    .select('id, event_id, participant_id, team_name, is_open, status, registration_type, members:team_members(id), events(max_team_size)')
    .eq('id', teamRegId)
    .maybeSingle()

  if (!team || team.registration_type !== 'team') return { error: 'Team not found' }
  if (team.status !== 'confirmed') return { error: 'This team is no longer active' }

  // SRM IST and other-college students never share a team.
  const teamPool = await poolOf(admin, team.participant_id)
  if ((await poolOf(admin, seekerParticipantId)) !== teamPool) return { error: teamPoolMessage(teamPool) }

  const maxSize = (team.events as any)?.max_team_size ?? null
  const size = (team.members as any[])?.length ?? 0
  if (maxSize != null && size >= maxSize) return { error: 'This team is already full' }

  // Guard: the seeker must not already be a member of the target team.
  const { data: dupMember } = await admin
    .from('team_members')
    .select('id')
    .eq('registration_id', teamRegId)
    .eq('participant_id', seekerParticipantId)
    .maybeSingle()
  if (dupMember) return { error: 'Already a member of this team' }

  // The seeker's identity comes from their own (size-1) registration's member row.
  const { data: seekerReg } = await admin
    .from('registrations')
    .select('id, event_id, members:team_members(full_name, email)')
    .eq('id', seekerRegId)
    .maybeSingle()
  if (!seekerReg || seekerReg.event_id !== team.event_id) return { error: 'Seeker not found' }

  const seekerMember = (seekerReg.members as any[])?.[0]
  const { error: insErr } = await admin.from('team_members').insert({
    registration_id: teamRegId,
    participant_id:  seekerParticipantId,
    full_name:       seekerMember?.full_name ?? 'Participant',
    email:           seekerMember?.email ?? null,
    is_leader:       false,
  })
  if (insErr) return { error: insErr.message }

  // Dissolve the seeker's team-of-one (its team_members cascade; QR object is
  // best-effort). This keeps them counted once — as a member of the team.
  const { data: seekerRow } = await admin
    .from('registrations')
    .select('qr_code_url')
    .eq('id', seekerRegId)
    .maybeSingle()
  if (seekerRow?.qr_code_url && !seekerRow.qr_code_url.startsWith('http')) {
    await admin.storage.from('qrcodes').remove([seekerRow.qr_code_url]).catch(() => {})
  }
  await admin.from('registrations').delete().eq('id', seekerRegId)

  // Cancel the seeker's other pending matches; they're placed now.
  await admin
    .from('team_invites')
    .update({ status: 'cancelled', responded_at: new Date().toISOString() })
    .eq('seeker_participant_id', seekerParticipantId)
    .eq('event_id', team.event_id)
    .eq('status', 'pending')

  // If the team is now full, drop it from the finder pool.
  if (maxSize != null && size + 1 >= maxSize) {
    await admin.from('registrations').update({ is_open: false }).eq('id', teamRegId)
  }

  return { teamName: team.team_name }
}
