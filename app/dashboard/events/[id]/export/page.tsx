// Owner: FE2 - Export page
'use client'

import { useParams } from 'next/navigation'
import {
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react'

import { ExportButton } from '@/components/dashboard/ExportButton'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

export default function ExportPage() {
  const { id } =
    useParams<{ id: string }>()

  return (
    <div className="space-y-6">

      {/* Hero */}
      <DashboardPageHeader
        icon={Download}
        kicker="Export"
        title="Export registrations"
        description={'Download this event’s registrations as CSV or Excel.'}
      />

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* CSV */}
        <section className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm transition-all duration-300 md:border-4">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-xl border-2 border-border bg-primary-yellow p-3 text-foreground">
              <FileText size={18} />
            </span>

            <div>

              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                CSV Export
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
                Plain comma-separated file. Opens in Google Sheets, Excel or Numbers.
              </p>

            </div>

          </div>

          <ExportButton
            eventId={id}
            format="csv"
          />

        </section>

        {/* Excel */}
        <section className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm transition-all duration-300 md:border-4">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-xl border-2 border-border bg-primary-blue p-3 text-white">
              <FileSpreadsheet size={18} />
            </span>

            <div>

              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                Excel Export
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">
                An .xlsx workbook, ready to filter and sort in Excel.
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
        Both files include registrations, team members, attendance status and answers to custom fields.
      </div>

    </div>
  )
}