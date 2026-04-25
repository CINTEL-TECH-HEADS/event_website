// lib/export/csv.ts
// Builds a CSV string from registrations + attendance data.
// Custom form field answers are added as extra columns.

import { createAdminClient } from '@/lib/supabase/server'

export async function buildCsv(event_id: string): Promise<string> {
  const admin = createAdminClient()

  // Fetch form fields to use as column headers
  const { data: fields } = await admin
    .from('form_fields')
    .select('id, label, applies_to')
    .eq('event_id', event_id)
    .order('sort_order')

  // Fetch registrations with attendance
  const { data: registrations } = await admin
    .from('registrations')
    .select(`
      id, display_id, registration_type, team_name,
      leader_name, leader_email, leader_phone,
      status, waitlist_position, registered_at,
      attendance ( checked_in_at, method ),
      registration_answers ( field_id, answer )
    `)
    .eq('event_id', event_id)
    .order('registered_at', { ascending: true })

  if (!registrations || registrations.length === 0) {
    return 'No registrations found'
  }

  // Build header row
  const baseHeaders = [
    'Display ID', 'Type', 'Team Name',
    'Leader Name', 'Leader Email', 'Leader Phone',
    'Status', 'Waitlist Position', 'Registered At',
    'Checked In', 'Check-in Time', 'Check-in Method',
  ]

  const fieldHeaders = (fields ?? []).map(f => f.label)
  const headers = [...baseHeaders, ...fieldHeaders]

  // Build data rows
  const rows = registrations.map((reg: any) => {
    const attendance = reg.attendance?.[0]

    const baseValues = [
      reg.display_id,
      reg.registration_type,
      reg.team_name ?? '',
      reg.leader_name,
      reg.leader_email,
      reg.leader_phone,
      reg.status,
      reg.waitlist_position ?? '',
      new Date(reg.registered_at).toLocaleString('en-IN'),
      attendance ? 'Yes' : 'No',
      attendance ? new Date(attendance.checked_in_at).toLocaleString('en-IN') : '',
      attendance?.method ?? '',
    ]

    // Map form answers to field columns
    const answerMap: Record<string, string> = {}
    for (const ans of (reg.registration_answers ?? [])) {
      answerMap[ans.field_id] = ans.answer
    }

    const fieldValues = (fields ?? []).map(f => answerMap[f.id] ?? '')

    return [...baseValues, ...fieldValues]
  })

  // Escape and join
  const escape = (val: string) => {
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvLines = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ]

  return csvLines.join('\n')
}