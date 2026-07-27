// Owner: FE2 - Payments tab (placeholder). Real payment tracking is pending;
// GET /api/events/[id]/payments already exists (stub) for when it's built.
'use client'

import { IndianRupee } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <IndianRupee size={14} />
          Payments
        </span>
        <h1 className="mt-5 text-3xl font-bold text-white">Track this event&apos;s payments.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          A record of participant payments for this event will appear here.
        </p>
      </section>

      <section className="app-panel p-8">
        <div className="mx-auto max-w-md border border-dashed border-[#243B72] bg-[#0B1736] p-10 text-center">
          <p className="text-sm font-semibold text-white">Payment tracking coming soon</p>
          <p className="mt-2 text-sm text-slate-400">
            Payment gateway integration is pending. Once live, every payment for this event will be listed
            and reconcilable here.
          </p>
        </div>
      </section>
    </div>
  )
}
