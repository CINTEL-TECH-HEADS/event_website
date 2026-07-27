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
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  const fee = reg?.events?.fee ?? 0
  const alreadyPaid = reg?.payment_status === 'paid'

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link
        href="/participant/portal"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={14} /> Back to My Events
      </Link>

      <div className="border border-white/10 bg-[#0a1629] p-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
          <IndianRupee size={14} /> Payment
        </div>
        <h1 className="text-2xl font-semibold text-white">{reg?.events?.title}</h1>

        <div className="mt-6 flex items-baseline justify-between border-y border-white/10 py-5">
          <span className="text-sm text-slate-400">Amount due</span>
          <span className="text-3xl font-bold text-white">₹{fee}</span>
        </div>

        {alreadyPaid ? (
          <div className="mt-6 rounded border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            This registration is already paid.{' '}
            <Link href={`/confirmation/${registration_id}`} className="font-semibold underline">
              View your pass
            </Link>
          </div>
        ) : (
          <>
            <button
              onClick={pay}
              disabled={paying}
              className="mt-6 flex w-full items-center justify-center gap-2 bg-[#F5E62D] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:opacity-60"
            >
              {paying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {paying ? 'Processing…' : 'Simulate successful payment'}
            </button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <p className="mt-3 text-center text-xs text-slate-500">
              Payment gateway integration is pending — this simulates a successful payment and issues your
              pass.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
