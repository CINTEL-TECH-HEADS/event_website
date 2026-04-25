// Owner: FE1 — Confirmation Page (Premium UI)

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRDisplay } from '@/components/public/QRDisplay'

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/registrations/${id}`)
        const json = await res.json()
        setData(json.data ?? null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading confirmation...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">

        {/* Icon */}
        <div className="text-6xl">🎉</div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Registration Successful
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Your seat has been reserved successfully.
          </p>
        </div>

        {/* Registration ID */}
        <div className="bg-slate-50 rounded-2xl py-4 px-4 border">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Registration ID
          </p>

          <p className="text-lg font-semibold text-slate-800 mt-1 break-all">
            {id}
          </p>
        </div>

        {/* QR */}
        {data?.qr_code_url ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Entry QR Code
            </p>

            <div className="flex justify-center">
              <QRDisplay qrCodeUrl={data.qr_code_url} />
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4 text-sm text-amber-700">
            QR code will be generated shortly.
          </div>
        )}

        {/* Email */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-4 text-sm text-teal-700">
          Confirmation email will be sent soon.
        </div>

        {/* Buttons */}
        <div className="space-y-3">

          <a
            href="/"
            className="block w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 transition"
          >
            Back to Events
          </a>

          <a
            href="/resend"
            className="block text-sm text-slate-500 hover:text-slate-800"
          >
            Resend confirmation email
          </a>

        </div>

      </div>
    </div>
  )
}