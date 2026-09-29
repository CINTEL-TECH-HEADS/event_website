// lib/export/attendance.ts — attendance cells shared by the CSV and Excel exports.
// Attendance embeds as a single object (one row per registration), not an array.
export function attendanceOf(reg: any): { checked_in_at: string; method: string } | null {
  const a = Array.isArray(reg?.attendance) ? reg.attendance[0] : reg?.attendance
  return a?.checked_in_at ? a : null
}

// Teams: "2/3: Asha, Ravi" (who was marked present). Solo: empty.
export function membersPresent(reg: any): string {
  if (reg?.registration_type !== 'team') return ''
  const members: any[] = reg.team_members ?? []
  const here = members.filter((m) => m.checked_in_at)
  return `${here.length}/${members.length}` + (here.length ? `: ${here.map((m) => m.full_name).join(', ')}` : '')
}
