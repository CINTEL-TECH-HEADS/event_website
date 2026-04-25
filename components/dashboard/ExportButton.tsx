// Owner: FE2 - Reusable export button for CSV/Excel
'use client'
import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  eventId: string
  format?: 'csv' | 'xlsx'
  className?: string
}

export function ExportButton({ eventId, format = 'csv', className = '' }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const res = await fetch(`/api/export?event_id=${eventId}&format=${format}`)
      if (!res.ok) {
        throw new Error('Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`app-button-primary ${className}`}
    >
      {exporting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download size={16} />
          Export {format.toUpperCase()}
        </>
      )}
    </button>
  )
}
