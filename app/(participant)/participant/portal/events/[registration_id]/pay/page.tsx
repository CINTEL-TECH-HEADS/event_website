'use client'

// Payment step (simulated). Shows the amount and a "Simulate successful payment"
// button; on success the pass is issued and we go to the confirmation page.
// Designed so a real gateway (PhonePe/UPI) can replace the simulate call later.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, IndianRupee, Loader2, ShieldCheck } from 'lucide-react'

export default function PayPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const router = useRouter()
  const [reg, setReg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/participant/registrations/${registration_id}`)
      .then((r) => r.json())
      .then(({ data }) => setReg(data))
      .finally(() => setLoading(false))
  }, [registration_id])

  async function pay() {
    setPaying(true)
    setError(null)
    const { data, error } = await fetch('/api/payments/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id }),
    }).then((r) => r.json())
    if (error) {
      setError(error)
      setPaying(false)
      return
    }
    router.push(`/confirmation/${registration_id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const fee = reg?.events?.fee ?? 0
  const alreadyPaid = reg?.payment_status === 'paid'

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link
        href="/participant/portal"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground-soft transition hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to My Events
      </Link>

      <div className="relative overflow-hidden rounded-poster border-4 border-border bg-panel p-6 shadow-lg">
        <div className="mb-1 flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
          <IndianRupee size={14} /> Payment
        </div>
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground">{reg?.events?.title}</h1>

        <div className="mt-6 flex items-baseline justify-between border-y-2 border-border py-5">
          <span className="text-sm font-bold uppercase tracking-wide text-foreground-soft">Amount due</span>
          <span className="font-display text-3xl text-foreground">₹{fee}</span>
        </div>

        {alreadyPaid ? (
          <div className="mt-6 rounded-xl border-2 border-border bg-success/15 px-4 py-3 text-sm font-medium text-foreground">
            This registration is already paid.{' '}
            <Link href={`/confirmation/${registration_id}`} className="font-bold underline">
              View your pass
            </Link>
          </div>
        ) : (
          <>
            <button
              onClick={pay}
              disabled={paying}
              className="app-button-primary !bg-primary-yellow !text-[#121212] mt-6 flex w-full !py-4 disabled:opacity-60"
            >
              {paying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {paying ? 'Processing…' : 'Simulate successful payment'}
            </button>
            {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}
            <p className="mt-3 text-center text-xs font-medium text-foreground-soft">
              Payment gateway integration is pending — this simulates a successful payment and issues your
              pass.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
