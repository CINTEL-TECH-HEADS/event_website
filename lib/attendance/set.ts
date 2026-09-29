// lib/attendance/set.ts
//
// Sets who is present for one registration. Solo registrations are present or
// not (one `attendance` row). Teams share one QR and one attendance row, but
// each member has their own `team_members.checked_in_at`: the team has an
// attendance row exactly when at least one member is present.

import type { SupabaseClient } from '@supabase/supabase-js'
import { logAction } from '@/lib/audit/log'

export type AttendanceMethod = 'qr_scan' | 'manual'

export type AttendanceMember = {
  id: string
  full_name: string
  email: string
  is_leader: boolean
  checked_in_at: string | null
}

export type AttendanceState = {
  registration_id: string
  registration_type: 'solo' | 'team'
  leader_name: string
  team_name: string | null
  checked_in_at: string | null
  members: AttendanceMember[]
}

type Result = { state: AttendanceState } | { error: string; status: number }

// The registration, checked to belong to this event and be confirmed.
export async function loadAttendance(
  admin: SupabaseClient,
  eventId: string,
  registrationId: string
): Promise<Result> {
  const { data: reg } = await admin
    .from('registrations')
    .select('id, event_id, status, registration_type, leader_name, team_name')
    .eq('id', registrationId)
    .maybeSingle()

  if (!reg) return { error: 'Registration not found. Invalid QR code.', status: 404 }
  if (reg.event_id !== eventId) return { error: 'This QR code is for a different event.', status: 400 }
  if (reg.status === 'cancelled') return { error: 'This registration has been cancelled.', status: 400 }
  if (reg.status !== 'confirmed') {
    return { error: 'This registration is on the waitlist and has not been confirmed.', status: 400 }
  }

  const [{ data: att }, { data: members }] = await Promise.all([
    admin.from('attendance').select('checked_in_at').eq('registration_id', reg.id).maybeSingle(),
    reg.registration_type === 'team'
      ? admin
          .from('team_members')
          .select('id, full_name, email, is_leader, checked_in_at')
          .eq('registration_id', reg.id)
          .order('is_leader', { ascending: false })
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as AttendanceMember[] }),
  ])

  return {
    state: {
      registration_id: reg.id,
      registration_type: reg.registration_type,
      leader_name: reg.leader_name,
      team_name: reg.team_name,
      checked_in_at: att?.checked_in_at ?? null,
      members: (members ?? []) as AttendanceMember[],
    },
  }
}

export async function setAttendance(
  admin: SupabaseClient,
  opts: {
    eventId: string
    registrationId: string
    // Solo: present or not. Team: the members who are present.
    present?: boolean
    memberIds?: string[]
    method: AttendanceMethod
    actor: { id: string; email: string }
  }
): Promise<Result> {
  const loaded = await loadAttendance(admin, opts.eventId, opts.registrationId)
  if ('error' in loaded) return loaded
  const { state } = loaded
  const now = new Date().toISOString()

  let anyPresent: boolean
  if (state.registration_type === 'team') {
    if (!Array.isArray(opts.memberIds)) return { error: 'member_ids is required for a team', status: 400 }
    const memberIds = new Set(state.members.map((m) => m.id))
    if (opts.memberIds.some((id) => !memberIds.has(id))) {
      return { error: 'Someone in that list is not on this team.', status: 400 }
    }
    const present = new Set(opts.memberIds)
    const arriving = state.members.filter((m) => present.has(m.id) && !m.checked_in_at).map((m) => m.id)
    const leaving = state.members.filter((m) => !present.has(m.id) && m.checked_in_at).map((m) => m.id)
    if (arriving.length) {
      const { error } = await admin
        .from('team_members')
        .update({ checked_in_at: now, checked_in_by: opts.actor.id })
        .in('id', arriving)
      if (error) return { error: error.message, status: 500 }
    }
    if (leaving.length) {
      const { error } = await admin
        .from('team_members')
        .update({ checked_in_at: null, checked_in_by: null })
        .in('id', leaving)
      if (error) return { error: error.message, status: 500 }
    }
    anyPresent = present.size > 0
  } else {
    if (typeof opts.present !== 'boolean') return { error: 'present is required', status: 400 }
    anyPresent = opts.present
  }

  if (anyPresent && !state.checked_in_at) {
    const { error } = await admin.from('attendance').insert({
      registration_id: state.registration_id,
      event_id: opts.eventId,
      method: opts.method,
      checked_in_by: opts.actor.id,
    })
    // 23505: someone else checked them in at the same moment. Fine.
    if (error && error.code !== '23505') return { error: 'Failed to record attendance', status: 500 }
  } else if (!anyPresent && state.checked_in_at) {
    const { error } = await admin.from('attendance').delete().eq('registration_id', state.registration_id)
    if (error) return { error: error.message, status: 500 }
  }

  await logAction({
    actorId: opts.actor.id,
    actorEmail: opts.actor.email,
    action: 'attendance.update',
    targetType: 'registration',
    targetId: state.registration_id,
    eventId: opts.eventId,
    metadata: {
      method: opts.method,
      ...(state.registration_type === 'team'
        ? { present: opts.memberIds!.length, members: state.members.length }
        : { present: anyPresent }),
    },
  })

  return loadAttendance(admin, opts.eventId, opts.registrationId)
}
