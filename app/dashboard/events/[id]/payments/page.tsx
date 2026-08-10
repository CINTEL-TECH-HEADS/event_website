// Owner: FE2 - Payments tab. Lists payment submissions for the event so an
// organizer can verify each transaction and grant (or reject) the pass.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { IndianRupee, Check, X, ExternalLink, Loader2 } from 'lucide-react'

type Row = {
  id: string
  display_id: string
  team_name: string | null
  leader_name: string
  leader_email: string
  registration_type: 'solo' | 'team'
  status: string
  payment_status: string
  submission: null | {
    id: string
    method: 'upi' | 'bank'
    payer_upi_id: string | null
    transaction_id: string | null
    payee_name: string | null
    amount: number
    screenshot_path: string | null
    status: string
    note: string | null
  }
}

const STATUS_STYLE: Record<string, string> = {
  paid: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  submitted: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  rejected: 'text-red-300 bg-red-500/10 border-red-500/25',
  pending: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
}

export default function PaymentsPage() {
  const { id } = useParams<{ id: string }>()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await fetch(`/api/events/${id}/payments`).then((r) => r.json())
    setRows((data ?? []) as Row[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function act(registrationId: string, action: 'approve' | 'reject') {
    let note: string | undefined
    if (action === 'reject') {
      const reason = prompt('Reason for rejection (shown to the participant):')
      if (reason === null) return
      note = reason
    }
    setBusy(registrationId)
    const { error } = await fetch(`/api/events/${id}/payments/${registrationId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    }).then((r) => r.json())
    setBusy(null)
    if (error) { alert(error); return }
    load()
  }

  async function viewScreenshot(path: string) {
    const { data, error } = await fetch(`/api/uploads/file?path=${encodeURIComponent(path)}`).then((r) => r.json())
    if (error || !data?.url) { alert('Could not open screenshot.'); return }
    window.open(data.url, '_blank', 'noopener')
  }

  const pendingReview = rows.filter((r) => r.payment_status === 'submitted').length

  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <IndianRupee size={14} />
          Payments
        </span>
        <h1 className="mt-5 text-3xl font-bold text-white">Verify payments &amp; grant passes.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Participants pay via the event&apos;s configured method and submit proof. Review each transaction and
          approve to issue the pass. {pendingReview > 0 && (
            <span className="font-semibold text-amber-300">{pendingReview} awaiting review.</span>
          )}
        </p>
      </section>

      <section className="app-panel p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-[#243B72] bg-[#0B1736] p-10 text-center text-sm text-slate-400">
            No payments yet. Registrations for this paid event will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#243B72] text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-3 py-3">Registrant</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Payer</th>
                  <th className="px-3 py-3">Proof</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const s = r.submission
                  return (
                    <tr key={r.id} className="border-b border-[#132B59] align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-white">
                          {r.registration_type === 'team' ? (r.team_name ?? 'Team') : r.leader_name}
                        </p>
                        <p className="text-xs text-slate-500">{r.leader_email} · {r.display_id}</p>
                      </td>
                      <td className="px-3 py-3 text-white">{s ? `₹${s.amount}` : '—'}</td>
                      <td className="px-3 py-3 uppercase text-slate-300">{s?.method ?? '—'}</td>
                      <td className="px-3 py-3 font-mono text-slate-300">{s?.transaction_id ?? '—'}</td>
                      <td className="px-3 py-3 text-slate-300">{s?.payer_upi_id || s?.payee_name || '—'}</td>
                      <td className="px-3 py-3">
                        {s?.screenshot_path ? (
                          <button onClick={() => viewScreenshot(s.screenshot_path!)} className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200">
                            View <ExternalLink size={12} />
                          </button>
                        ) : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.payment_status] ?? STATUS_STYLE.pending}`}>
                          {r.payment_status}
                        </span>
                        {r.payment_status === 'rejected' && s?.note && (
                          <p className="mt-1 max-w-[160px] text-xs text-red-300/80">{s.note}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.payment_status === 'submitted' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => act(r.id, 'approve')}
                              disabled={busy === r.id}
                              className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => act(r.id, 'reject')}
                              disabled={busy === r.id}
                              className="inline-flex items-center gap-1 border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-slate-500">
                            {r.payment_status === 'paid' ? 'Pass issued' : r.payment_status === 'pending' ? 'Awaiting payment' : '—'}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
