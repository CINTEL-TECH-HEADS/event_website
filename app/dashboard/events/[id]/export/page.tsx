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
      <section className="app-panel rounded-[2rem] px-6 py-7 shadow-xl sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <Download size={14} />
          Data Export
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Download clean
          registration reports.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Export event data for
          operations, reporting,
          analysis, and handoffs.
        </p>

      </section>

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* CSV */}
        <section className="rounded-[1.8rem] border border-[#243B72] bg-[#10224A] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-2xl bg-[#0B1736] p-3 text-[#F5E62D]">
              <FileText size={18} />
            </span>

            <div>

              <h2 className="text-lg font-semibold text-white">
                CSV Export
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
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
        <section className="rounded-[1.8rem] border border-[#243B72] bg-[#10224A] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1">

          <div className="mb-5 flex items-start gap-4">

            <span className="rounded-2xl bg-[#0B1736] p-3 text-[#93C5FD]">
              <FileSpreadsheet size={18} />
            </span>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Excel Export
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Ideal for richer
                reports, filters,
                and Excel workflows.
              </p>

            </div>

          </div>

          <ExportButton
            eventId={id}
            format="xlsx"
            className="border border-[#243B72] bg-[#0B1736] text-[#93C5FD] hover:bg-[#132B59]"
          />

        </section>

      </div>

      {/* Info */}
      <div className="rounded-2xl border border-[#243B72] bg-[#10224A] px-5 py-4 text-sm text-slate-300">
        Includes registrations,
        team members,
        attendance status,
        and custom field
        responses.
      </div>

    </div>
  )
}