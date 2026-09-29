// Every confirmed registration and who was present, on the check-in page.
// Solo rows are a checkbox; team rows open the member checklist. Edits go to
// PUT /api/events/[id]/attendance/[registration_id].
'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ClipboardCheck, Search } from 'lucide-react'
import { TeamCheckInList, type CheckInMember } from './TeamCheckInList'

type Row = {
  id: string
  display_id: string
  registration_type: 'solo' | 'team'
  leader_name: string
  leader_email: string
  team_name: string | null
  members: CheckInMember[]
  checkedInAt: string | null
}

type Filter = 'all' | 'in' | 'out'

// Attendance embeds as a single object (one row per registration), not an array.
function checkedInAt(reg: any): string | null {
  const a = Array.isArray(reg?.attendance) ? reg.attendance[0] : reg?.attendance
  return a?.checked_in_at ?? null
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

export function AttendanceList({
  eventId,
  refreshSignal = 0,
  onChange,
}: {
  eventId: string
  // Bumped by the scanner so the list picks up new check-ins.
  refreshSignal?: number
  onChange?: () => void
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/registrations?status=confirmed`)
      const { data } = await res.json()
      setRows(
        (data ?? []).map((r: any) => ({
          id: r.id,
          display_id: r.display_id,
          registration_type: r.registration_type,
          leader_name: r.leader_name,
          leader_email: r.leader_email,
          team_name: r.team_name,
          members: [...(r.members ?? [])].sort((a: any, b: any) => Number(b.is_leader) - Number(a.is_leader)),
          checkedInAt: checkedInAt(r),
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    load()
  }, [load, refreshSignal])

  async function save(row: Row, body: { present?: boolean; member_ids?: string[] }) {
    setSavingId(row.id)
    try {
      const res = await fetch(`/api/events/${eventId}/attendance/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { data, error } = await res.json()
      if (!res.ok || !data) {
        alert(error ?? 'Could not save attendance.')
        return
      }
      setRows((current) =>
        current.map((r) => (r.id === row.id ? { ...r, members: data.members ?? r.members, checkedInAt: data.checked_in_at } : r))
      )
      if (row.registration_type === 'team') setOpenId(null)
      onChange?.()
    } finally {
      setSavingId(null)
    }
  }

  function toggleSolo(row: Row) {
    if (row.checkedInAt && !confirm(`Mark ${row.leader_name} as not checked in?`)) return
    save(row, { present: !row.checkedInAt })
  }

  const totals = useMemo(() => {
    let people = 0
    let present = 0
    for (const r of rows) {
      if (r.registration_type === 'team') {
        people += r.members.length
        present += r.members.filter((m) => m.checked_in_at).length
      } else {
        people += 1
        present += r.checkedInAt ? 1 : 0
      }
    }
    return { people, present, regs: rows.length, regsIn: rows.filter((r) => r.checkedInAt).length }
  }, [rows])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter === 'in' && !r.checkedInAt) return false
      if (filter === 'out' && r.checkedInAt) return false
      if (!q) return true
      const haystack = [r.leader_name, r.leader_email, r.display_id, r.team_name, ...r.members.flatMap((m) => [m.full_name, m.email])]
      return haystack.some((v) => v?.toLowerCase().includes(q))
    })
  }, [rows, search, filter])

  return (
    <section className="app-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-brand">
            <ClipboardCheck size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Attendance</h2>
            <p className="text-sm font-medium text-foreground-soft">
              {totals.present} of {totals.people} people present · {totals.regsIn} of {totals.regs} registrations checked in
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, team or ID"
            className="app-input pl-11"
          />
        </label>
        <div className="flex gap-2" role="group" aria-label="Filter attendance">
          {([
            ['all', 'All'],
            ['in', 'Checked in'],
            ['out', 'Not checked in'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-full border-2 border-border px-3 py-2 font-tech text-xs font-bold uppercase tracking-widest transition-colors duration-150 ${
                filter === value ? 'bg-accent text-white' : 'bg-panel-muted text-foreground-soft hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm font-bold uppercase tracking-widest text-foreground-soft">Loading attendance…</p>
      ) : visible.length === 0 ? (
        <div className="app-empty-state">{rows.length === 0 ? 'No confirmed registrations yet.' : 'Nobody matches that.'}</div>
      ) : (
        <ul className="divide-y-2 divide-border overflow-hidden rounded-xl border-2 border-border">
          {visible.map((r) => {
            const team = r.registration_type === 'team'
            const here = r.members.filter((m) => m.checked_in_at).length
            const open = openId === r.id
            return (
              <Fragment key={r.id}>
                <li className="flex flex-wrap items-center gap-3 bg-panel px-4 py-3">
                  {team ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : r.id)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ChevronDown size={18} className={`shrink-0 text-foreground-soft transition-transform ${open ? 'rotate-180' : ''}`} />
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-foreground">{r.team_name ?? r.leader_name}</span>
                        <span className="block truncate text-xs font-medium text-foreground-soft">
                          Team · {r.display_id} · led by {r.leader_name}
                        </span>
                      </span>
                    </button>
                  ) : (
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!r.checkedInAt}
                        disabled={savingId === r.id}
                        onChange={() => toggleSolo(r)}
                        className="h-5 w-5 shrink-0 accent-success"
                        aria-label={`${r.leader_name} is checked in`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-foreground">{r.leader_name}</span>
                        <span className="block truncate text-xs font-medium text-foreground-soft">
                          Solo · {r.display_id} · {r.leader_email}
                        </span>
                      </span>
                    </label>
                  )}

                  <span className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wide">
                    {team ? (
                      <span className={`app-badge ${here === 0 ? 'app-badge-neutral' : here === r.members.length ? 'app-badge-success' : 'app-badge-warning'}`}>
                        {here}/{r.members.length} present
                      </span>
                    ) : (
                      <span className={`app-badge ${r.checkedInAt ? 'app-badge-success' : 'app-badge-neutral'}`}>
                        {r.checkedInAt ? 'Present' : 'Not in'}
                      </span>
                    )}
                    {r.checkedInAt && <span className="text-foreground-soft">{time(r.checkedInAt)}</span>}
                  </span>
                </li>

                {team && open && (
                  <li className="bg-panel-muted px-4 py-4">
                    <TeamCheckInList
                      key={`${r.id}-${here}`}
                      members={r.members}
                      saving={savingId === r.id}
                      confirmLabel="Save attendance"
                      onConfirm={(ids) => save(r, { member_ids: ids })}
                      onCancel={() => setOpenId(null)}
                    />
                  </li>
                )}
              </Fragment>
            )
          })}
        </ul>
      )}
    </section>
  )
}
