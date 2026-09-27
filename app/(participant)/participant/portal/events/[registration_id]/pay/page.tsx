'use client'

// Manual payment step. Shows the organizer's active payment method (a scannable
// UPI-intent QR + UPI id, or bank account details), then collects proof
// (transaction/UTR + a method-specific field + a screenshot). An organizer
// verifies it in the Payments tab and grants the pass.

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { ArrowLeft, IndianRupee, Loader2, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react'

export default function PayPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const [reg, setReg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upiQr, setUpiQr] = useState<string | null>(null)

  // Form state
  const [txnId, setTxnId] = useState('')
  const [payerUpi, setPayerUpi] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    const { data } = await fetch(`/api/participant/registrations/${registration_id}`).then((r) => r.json())
    setReg(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [registration_id])

  const event = reg?.events
  const fee = event?.fee ?? 0
  const method: 'upi' | 'bank' | null = event?.payment_method ?? null
  const paymentStatus: string = reg?.payment_status ?? 'pending'
  const isTeam = reg?.registration_type === 'team'
  const memberCount = reg?.members?.length ?? 0
  const minSize = event?.min_team_size ?? 1
  const teamIncomplete = isTeam && memberCount < minSize

  // Latest submission (for rejected reason / under-review state).
  const latestSub = useMemo(() => {
    const subs = reg?.payment_submissions ?? []
    return [...subs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
  }, [reg])

  // Build the UPI-intent QR when the active method is UPI.
  useEffect(() => {
    if (method === 'upi' && event?.upi_id) {
      const params = new URLSearchParams({
        pa: event.upi_id,
        pn: event.upi_payee_name || event.title || 'Cintel',
        am: String(fee),
        cu: 'INR',
      })
      QRCode.toDataURL(`upi://pay?${params.toString()}`, { width: 240, margin: 1 })
        .then(setUpiQr)
        .catch(() => setUpiQr(null))
    }
  }, [method, event?.upi_id, event?.upi_payee_name, event?.title, fee])

  async function uploadScreenshot(file: File) {
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const { data, error } = await fetch('/api/uploads/file', { method: 'POST', body: fd }).then((r) => r.json())
    setUploading(false)
    if (error) { setError(error); return }
    setScreenshotPath(data.path)
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    const { error } = await fetch(`/api/participant/registrations/${registration_id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        transaction_id: txnId,
        payer_upi_id: payerUpi,
        payee_name: payeeName,
        screenshot_path: screenshotPath,
      }),
    }).then((r) => r.json())
    setSubmitting(false)
    if (error) { setError(error); return }
    await load()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link href="/participant/portal" className="mb-6 inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-foreground">
        <ArrowLeft size={14} /> My events
      </Link>

      <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-panel p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
          <IndianRupee size={14} /> Payment
        </div>
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground">{event?.title}</h1>

        <div className="mt-6 flex items-baseline justify-between border-y-2 border-border py-5">
          <span className="text-sm font-bold uppercase tracking-wide text-foreground-soft">Amount due</span>
          <span className="font-display text-3xl text-foreground">₹{fee}</span>
        </div>

        {/* Terminal + interstitial states */}
        {paymentStatus === 'paid' ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-border bg-success/15 px-4 py-3 text-sm font-medium text-foreground">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <div>
              Payment verified — you&apos;re confirmed.{' '}
              <Link href={`/participant/portal/events/${registration_id}/qr`} className="font-bold underline">View your pass</Link>
            </div>
          </div>
        ) : paymentStatus === 'submitted' ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-border bg-warning/30 font-medium px-4 py-3 text-sm text-foreground">
            <Clock size={18} className="mt-0.5 shrink-0" />
            <div>Payment under review. We&apos;ll issue your pass once an organizer verifies your transaction.</div>
          </div>
        ) : teamIncomplete ? (
          <div className="mt-6 rounded-xl border-2 border-border bg-panel-muted px-4 py-4 text-sm text-foreground-soft">
            Your team needs at least <strong>{minSize}</strong> members before you can pay (currently {memberCount}).{' '}
            <Link href={`/participant/portal/events/${registration_id}/team`} className="font-semibold text-brand underline">Manage team</Link>
          </div>
        ) : !method ? (
          <div className="mt-6 rounded-xl border-2 border-border bg-panel-muted px-4 py-4 text-sm text-foreground-soft">
            Payment details haven&apos;t been configured yet. Please check back shortly.
          </div>
        ) : (
          <>
            {paymentStatus === 'rejected' && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-border bg-danger/15 font-medium px-4 py-3 text-sm text-foreground">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  Your previous submission was rejected{latestSub?.note ? `: ${latestSub.note}` : '.'} Please pay again and resubmit.
                </div>
              </div>
            )}

            {/* Pay-to details */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-foreground-soft">
                Pay ₹{fee} via {method === 'upi' ? 'UPI' : 'bank transfer'}
              </p>
              {method === 'upi' ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-panel-muted p-4">
                  {upiQr && <img src={upiQr} alt="UPI QR" className="h-44 w-44 rounded bg-white p-2" />}
                  <p className="text-center text-sm text-foreground-soft">
                    Scan with any UPI app, or pay to
                    <br />
                    <span className="font-mono font-semibold text-foreground">{event.upi_id}</span>
                    {event.upi_payee_name && <span className="text-foreground-soft"> · {event.upi_payee_name}</span>}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 rounded-xl border-2 border-border bg-panel-muted p-4 text-sm text-foreground-soft">
                  <Row label="Account name" value={event.bank_account_name} />
                  <Row label="Account no." value={event.bank_account_number} mono />
                  <Row label="IFSC" value={event.bank_ifsc} mono />
                  <Row label="Bank" value={event.bank_name} />
                </div>
              )}
            </div>

            {/* Proof form */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Submit payment proof</p>
              <input
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder={method === 'upi' ? 'UPI reference / UTR number' : 'Transaction / UTR number'}
                className="app-input w-full text-sm"
              />
              {method === 'upi' ? (
                <input
                  value={payerUpi}
                  onChange={(e) => setPayerUpi(e.target.value)}
                  placeholder="Your UPI ID (VPA), e.g. you@oksbi"
                  className="app-input w-full text-sm"
                />
              ) : (
                <input
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Account-holder name"
                  className="app-input w-full text-sm"
                />
              )}

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-panel-muted px-4 py-3 text-sm text-foreground-soft hover:border-accent">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} className="text-brand" />}
                {screenshotPath ? 'Screenshot attached — replace' : 'Attach payment screenshot'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f) }}
                />
              </label>

              {error && <p className="text-sm font-bold text-danger">{error}</p>}

              <button
                onClick={submit}
                disabled={submitting || uploading}
                className="app-button-primary !bg-primary-yellow !text-[#121212] flex w-full !py-4 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {submitting ? 'Submitting…' : 'Submit for verification'}
              </button>
              <p className="text-center text-xs text-foreground-soft">
                Your pass is issued after an organizer verifies your payment.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-foreground-soft">{label}</span>
      <span className={`text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
