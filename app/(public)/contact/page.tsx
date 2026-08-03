'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, User } from 'lucide-react'

type Contact = {
  id: string
  name: string
  designation: string
  email: string | null
  phone: string | null
}

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then(({ data }) => setContacts((data ?? []) as Contact[]))
      .catch(() => setError('Unable to load contacts right now.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-200">Get in touch</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-sm text-slate-400">
          Reach out to the CINTEL Student Association team for event queries and support.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-sm backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading contacts...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{error}</div>
      ) : contacts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Contact details coming soon</h2>
          <p className="mt-2 text-sm text-slate-400">Check back shortly — our team&apos;s details will be listed here.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-3xl border border-white/10 bg-[#112240] p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200">
                  <User size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-white">{c.name}</p>
                  <p className="truncate text-sm text-amber-200">{c.designation}</p>
                </div>
              </div>

              {(c.email || c.phone) && (
                <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-2 text-slate-300 transition hover:text-amber-200"
                    >
                      <Mail size={15} className="shrink-0 text-slate-500" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  )}
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-2 text-slate-300 transition hover:text-amber-200"
                    >
                      <Phone size={15} className="shrink-0 text-slate-500" />
                      <span className="truncate">{c.phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
