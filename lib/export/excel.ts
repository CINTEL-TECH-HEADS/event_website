// lib/export/excel.ts
// Builds an Excel (.xlsx) file from registrations + attendance data.
// Uses the 'xlsx' npm package. Color-coded status column. Auto-filters.

import * as XLSX from 'xlsx'
import { attendanceOf, membersPresent } from './attendance'
import { createAdminClient } from '@/lib/supabase/server'

export async function buildExcel(event_id: string): Promise<Buffer> {
  const admin = createAdminClient()

  // Fetch form fields
  const { data: fields } = await admin
    .from('form_fields')
    .select('id, label, audience')
    .eq('event_id', event_id)
    .order('sort_order')

  // Fetch registrations
  const { data: registrations } = await admin
    .from('registrations')
    .select(`
      id, display_id, registration_type, team_name,
      leader_name, leader_email, leader_phone,
      status, waitlist_position, registered_at,
      attendance ( checked_in_at, method ),
      team_members ( full_name, checked_in_at ),
      registration_answers ( field_id, answer )
    `)
    .eq('event_id', event_id)
    .order('registered_at', { ascending: true })

  const fieldList = fields ?? []
  const regList = registrations ?? []

  // Build rows
  const rows = regList.map((reg: any) => {
    const attendance = attendanceOf(reg)

    const answerMap: Record<string, string> = {}
    for (const ans of (reg.registration_answers ?? [])) {
      answerMap[ans.field_id] = ans.answer
    }

    const row: Record<string, string | number> = {
      'Display ID': reg.display_id,
      'Type': reg.registration_type,
      'Team Name': reg.team_name ?? '',
      'Leader Name': reg.leader_name,
      'Leader Email': reg.leader_email,
      'Leader Phone': reg.leader_phone,
      'Status': reg.status,
      'Waitlist Position': reg.waitlist_position ?? '',
      'Registered At': new Date(reg.registered_at).toLocaleString('en-IN'),
      'Checked In': attendance ? 'Yes' : 'No',
      'Check-in Time': attendance ? new Date(attendance.checked_in_at).toLocaleString('en-IN') : '',
      'Check-in Method': attendance?.method ?? '',
      'Members Present': membersPresent(reg),
    }

    for (const field of fieldList) {
      // Other-college form fields are labelled so same-named fields don't collide.
      row[field.audience === 'external' ? `Other college: ${field.label}` : field.label] = answerMap[field.id] ?? ''
    }

    return row
  })

  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Display ID
    { wch: 8 },  // Type
    { wch: 20 },  // Team Name
    { wch: 20 },  // Leader Name
    { wch: 28 },  // Leader Email
    { wch: 14 },  // Leader Phone
    { wch: 12 },  // Status
    { wch: 8 },  // Waitlist Position
    { wch: 22 },  // Registered At
    { wch: 10 },  // Checked In
    { wch: 22 },  // Check-in Time
    { wch: 14 },  // Check-in Method
    { wch: 28 },  // Members Present
    ...fieldList.map(() => ({ wch: 20 })),
  ]

  // Auto-filter on first row
  const totalCols = 12 + fieldList.length
  ws['!autofilter'] = {
    ref: `A1:${XLSX.utils.encode_col(totalCols - 1)}1`,
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf
}