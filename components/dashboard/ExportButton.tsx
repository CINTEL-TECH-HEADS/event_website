// Owner: FE2 - Reusable export button for CSV/Excel
'use client'

import { useState } from 'react'
import {
  Download,
  Loader2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'

interface Props {
  eventId: string
  format?: 'csv' | 'xlsx'
  className?: string
}

export function ExportButton({
  eventId,
  format = 'csv',
  className = '',
}: Props) {
  const [exporting, setExporting] =
    useState(false)

  async function handleExport() {
    setExporting(true)

    try {
      const res = await fetch(
        `/api/export?event_id=${eventId}&format=${format}`
      )

      if (!res.ok) {
        throw new Error(
          'Export failed'
        )
      }

      const blob =
        await res.blob()

      const url =
        window.URL.createObjectURL(
          blob
        )

      const a =
        document.createElement(
          'a'
        )

      a.href = url

      a.download = `registrations-${
        new Date()
          .toISOString()
          .split('T')[0]
      }.${format}`

      document.body.appendChild(
        a
      )

      a.click()

      window.URL.revokeObjectURL(
        url
      )

      document.body.removeChild(
        a
      )
    } catch (error) {
      console.error(
        'Export failed:',
        error
      )

      alert(
        'Failed to export. Please try again.'
      )
    } finally {
      setExporting(false)
    }
  }

  const Icon =
    format === 'csv'
      ? FileText
      : FileSpreadsheet

  const colorClass =
    format === 'csv'
      ? 'bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white'
      : 'bg-[#8B5E3C] hover:opacity-90 text-white'

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${colorClass} ${className}`}
    >
      {exporting ? (
        <>
          <Loader2
            size={16}
            className="animate-spin"
          />
          Exporting...
        </>
      ) : (
        <>
          <Icon size={16} />
          <Download size={15} />
          Export{' '}
          {format.toUpperCase()}
        </>
      )}
    </button>
  )
}