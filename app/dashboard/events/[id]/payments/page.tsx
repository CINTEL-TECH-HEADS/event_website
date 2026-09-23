// Owner: FE2 - Payments tab (placeholder). Real payment tracking is pending;
// GET /api/events/[id]/payments already exists (stub) for when it's built.
'use client'

import { IndianRupee } from 'lucide-react'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <IndianRupee size={14} />
          Payments
        </span>
        <h1 className="app-heading mt-5">Track this event&apos;s payments.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          A record of participant payments for this event will appear here.
        </p>
      </section>

      <section className="app-panel p-8">
        <div className="app-empty-state mx-auto max-w-md p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">Payment tracking coming soon</p>
          <p className="mt-2 text-sm font-medium text-foreground-soft">
            Payment gateway integration is pending. Once live, every payment for this event will be listed
            and reconcilable here.
          </p>
        </div>
      </section>
    </div>
  )
}
