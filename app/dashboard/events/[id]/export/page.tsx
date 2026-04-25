// Owner: FE2 - Export page
'use client'
import { useParams } from 'next/navigation'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { ExportButton } from '@/components/dashboard/ExportButton'

export default function ExportPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">Data Export</span>
        <h1 className="app-heading mt-4">Download clean registration data for ops and reporting.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Choose the format that fits your workflow, whether you need lightweight CSV files or
          richer Excel sheets for analysis.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="app-panel rounded-[1.8rem] p-6">
          <div className="mb-5 flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-brand-600">
              <FileText size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">CSV Export</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Great for spreadsheets, imports, and fast operational handoffs.
              </p>
            </div>
          </div>
          <ExportButton eventId={id} format="csv" />
        </section>

        <section className="app-panel rounded-[1.8rem] p-6">
          <div className="mb-5 flex items-start gap-4">
            <span className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Excel Export</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Best when organizers need richer tabular review in Excel-compatible tools.
              </p>
            </div>
          </div>
          <ExportButton eventId={id} format="xlsx" className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20" />
        </section>
      </div>

      <div className="app-alert-info">
        Includes registration details, team members, custom field answers, and attendance status.
      </div>
    </div>
  )
}
