// Owner: FE2 - Payments tab. Lists payment submissions for the event so an
// organizer can verify each transaction and grant (or reject) the pass.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { IndianRupee, Check, X, ExternalLink, Loader2 } from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

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
  paid: 'app-badge-success',
  submitted: 'app-badge-warning',
  rejected: 'app-badge-danger',
  pending: 'app-badge-neutral',
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
      <DashboardPageHeader
        icon={IndianRupee}
        kicker="Payments"
        title="Verify payments"
        description={<>Participants pay using this event&apos;s payment method and upload proof. Approving a payment issues their QR pass.{pendingReview > 0 && <span className="font-bold text-brand"> {pendingReview} awaiting review.</span>}</>}
      />

      <section className="overflow-hidden rounded-2xl border-2 border-border bg-panel p-4 sm:border-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-foreground-soft"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="app-empty-state p-10 text-center text-sm text-foreground-soft">
            No payments yet. Registrations for this paid event will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-panel-muted font-tech text-xs font-bold uppercase tracking-wider text-foreground">
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
                    <tr key={r.id} className="border-b-2 border-border align-top transition duration-200 ease-out hover:bg-panel-muted">
                      <td className="px-3 py-3">
                        <p className="font-bold text-foreground">
                          {r.registration_type === 'team' ? (r.team_name ?? 'Team') : r.leader_name}
                        </p>
                        <p className="text-xs text-foreground-soft">{r.leader_email} · {r.display_id}</p>
                      </td>
                      <td className="px-3 py-3 text-foreground">{s ? `₹${s.amount}` : '—'}</td>
                      <td className="px-3 py-3 uppercase text-foreground-soft">{s?.method ?? '—'}</td>
                      <td className="px-3 py-3 font-mono text-foreground-soft">{s?.transaction_id ?? '—'}</td>
                      <td className="px-3 py-3 text-foreground-soft">{s?.payer_upi_id || s?.payee_name || '—'}</td>
                      <td className="px-3 py-3">
                        {s?.screenshot_path ? (
                          <button onClick={() => viewScreenshot(s.screenshot_path!)} className="inline-flex items-center gap-1 font-bold text-accent hover:text-brand">
                            View <ExternalLink size={12} />
                          </button>
                        ) : <span className="text-foreground-soft">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`app-badge whitespace-nowrap ${STATUS_STYLE[r.payment_status] ?? STATUS_STYLE.pending}`}>
                          {r.payment_status}
                        </span>
                        {r.payment_status === 'rejected' && s?.note && (
                          <p className="mt-1 max-w-[160px] text-xs text-danger">{s.note}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {r.payment_status === 'submitted' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => act(r.id, 'approve')}
                              disabled={busy === r.id}
                              className="app-button-success inline-flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => act(r.id, 'reject')}
                              disabled={busy === r.id}
                              className="app-button-danger inline-flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-foreground-soft">
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
