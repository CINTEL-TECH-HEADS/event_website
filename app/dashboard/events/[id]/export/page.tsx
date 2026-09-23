// Owner: FE2 - Export page
'use client'

import { useParams } from 'next/navigation'
import {
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react'

import { ExportButton } from '@/components/dashboard/ExportButton'

export default function ExportPage() {
  const { id } =
    useParams<{ id: string }>()

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel  px-6 py-7  sm:px-8">

        <span className="app-kicker inline-flex items-center gap-2">
          <Download size={14} />
          Data Export
        </span>

        <h1 className="app-heading mt-5">
          Download clean
          registration reports.
        </h1>

        <p className="app-subheading mt-3 max-w-2xl">
          Export event data for
          operations, reporting,
          analysis, and handoffs.
        </p>

      </section>

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* CSV */}
        <section className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 md:border-4">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-xl border-2 border-border bg-primary-yellow p-3 text-foreground">
              <FileText size={18} />
            </span>

            <div>

              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                CSV Export
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
                Best for spreadsheets,
                imports, and quick
                operational sharing.
              </p>

            </div>

          </div>

          <ExportButton
            eventId={id}
            format="csv"
          />

        </section>

        {/* Excel */}
        <section className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 md:border-4">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-xl border-2 border-border bg-primary-blue p-3 text-white">
              <FileSpreadsheet size={18} />
            </span>

            <div>

              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                Excel Export
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
                Ideal for richer
                reports, filters,
                and Excel workflows.
              </p>

            </div>

          </div>

          <ExportButton
            eventId={id}
            format="xlsx"
          />

        </section>

      </div>

      {/* Info */}
      <div className="app-alert-info">
        Includes registrations,
        team members,
        attendance status,
        and custom field
        responses.
      </div>

    </div>
  )
}