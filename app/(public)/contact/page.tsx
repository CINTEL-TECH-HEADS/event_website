'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { PageHeader } from '@/components/site/PageHeader'
import { CLUB, SOCIALS } from '@/lib/club'

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        kicker={CLUB.name}
        title="Contact"
        description="Questions about an event, a registration or a payment? Write to the association or reach the organizers below."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* The association */}
        <aside className="poster-panel p-6">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.12]" />
          <p className="relative font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-primary-yellow">The association</p>
          <a
            href={`mailto:${CLUB.email}`}
            className="relative mt-4 flex items-start gap-2 break-all text-sm font-bold text-[#F5F0E3] hover:text-primary-yellow"
          >
            <Mail size={16} className="mt-0.5 shrink-0 text-primary-yellow" strokeWidth={2.5} />
            {CLUB.email}
          </a>
          <p className="relative mt-4 flex items-start gap-2 text-sm leading-6 text-[#F5F0E3]/80">
            <MapPin size={16} className="mt-1 shrink-0 text-primary-yellow" strokeWidth={2.5} />
            <span>
              {CLUB.department}
              <br />
              {CLUB.institution}, {CLUB.campus}
            </span>
          </p>
          <ul className="relative mt-5 space-y-2 border-t-2 border-[#F5F0E3]/20 pt-4 text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 text-[#F5F0E3]/85 hover:text-primary-yellow"
                >
                  <span>
                    {s.label} <span className="text-[#F5F0E3]/50">· {s.handle}</span>
                  </span>
                  <ExternalLink size={13} className="shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Organizer directory (managed from the dashboard) */}
        <section>
          <h2 className="font-display text-lg uppercase tracking-tight text-foreground">Organizers</h2>
          {loading ? (
            <div className="mt-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          ) : error ? (
            <p className="mt-4 rounded-2xl border-2 border-border bg-danger p-5 text-sm font-bold text-white">{error}</p>
          ) : contacts.length === 0 ? (
            <p className="mt-4 app-empty-state text-sm font-medium text-foreground-soft">
              No organizer contacts are listed right now. Write to {CLUB.email} and the association will reply.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {contacts.map((c) => (
                <li key={c.id} className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
                  <p className="text-base font-black uppercase tracking-tight text-foreground">{c.name}</p>
                  <p className="font-tech text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{c.designation}</p>
                  {(c.email || c.phone) && (
                    <div className="mt-4 space-y-2 border-t-2 border-border pt-3 text-sm">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-2 font-medium text-foreground-soft hover:text-brand">
                          <Mail size={15} className="shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-2 font-medium text-foreground-soft hover:text-brand">
                          <Phone size={15} className="shrink-0" />
                          <span className="truncate">{c.phone}</span>
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
