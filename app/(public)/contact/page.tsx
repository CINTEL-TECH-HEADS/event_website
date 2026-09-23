'use client'

import { useEffect, useState } from 'react'
import { Mail, Phone, User } from 'lucide-react'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
      <div className="poster-panel relative mb-8 overflow-hidden p-6 sm:p-10">
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
        <Starburst rings color="#F2C230" className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 opacity-80 sm:h-40 sm:w-40" />
        <RockShape variant={3} fill="#D6294C" className="pointer-events-none absolute bottom-2 left-4 hidden h-14 w-14 rotate-[18deg] opacity-90 sm:block" />
        <Sparkle className="pointer-events-none absolute right-1/3 bottom-4 h-3 w-3 text-primary-yellow" />
        <p className="relative font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-primary-yellow">Get in touch</p>
        <PosterHeading as="h1" fillClassName="text-primary-yellow" className="relative mt-3 text-4xl sm:text-6xl">
          Contact Us
        </PosterHeading>
        <p className="relative mt-3 max-w-lg font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
          Reach out to the CINTEL Student Association team for event queries and support.
        </p>
      </div>

      {loading ? (
        <div className="app-empty-state">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-foreground-soft">Loading contacts...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-danger bg-danger/10 p-8 text-center text-sm font-medium text-danger lg:border-4">
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div className="app-empty-state">
          <h2 className="text-xl font-bold uppercase tracking-tight text-foreground">Contact details coming soon</h2>
          <p className="mt-2 text-sm font-medium text-foreground-soft">
            Check back shortly — our team&apos;s details will be listed here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((c, i) => {
            const accent = [
              'bg-primary-red',
              'bg-primary-yellow',
              'bg-[#14120F]',
            ][i % 3]
            return (
              <div
                key={c.id}
                className="app-card-hover relative overflow-hidden !rounded-poster border-2 border-border bg-panel p-6 shadow-md"
              >
                <Sparkle className={`absolute right-3 top-3 h-4 w-4 ${i % 3 === 0 ? 'text-primary-red' : i % 3 === 1 ? 'text-primary-yellow' : 'text-foreground'}`} />
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border text-white ${accent}`}>
                    <User size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold uppercase tracking-tight text-foreground">{c.name}</p>
                    <p className="truncate font-tech text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{c.designation}</p>
                  </div>
                </div>

                {(c.email || c.phone) && (
                  <div className="mt-5 space-y-2 border-t-2 border-border pt-4 text-sm">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-2 font-medium text-foreground-soft transition-colors duration-200 hover:text-brand"
                      >
                        <Mail size={15} className="shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-2 font-medium text-foreground-soft transition-colors duration-200 hover:text-brand"
                      >
                        <Phone size={15} className="shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
