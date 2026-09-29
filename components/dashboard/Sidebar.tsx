// Owner: FE2

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Home,
  Contact,
} from 'lucide-react'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { PlanetMark } from '@/components/brand/PlanetMark'

type Profile = {
  full_name?: string
  email?: string
}

type EventWithStats = {
  id: string
  title: string
  venue: string
  confirmed_count: number
}

export function Sidebar() {
  const pathname =
    usePathname()

  const [profile, setProfile] =
    useState<Profile>()

  const [events, setEvents] =
    useState<EventWithStats[]>([])

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => me?.email && setProfile({ email: me.email }))
      .catch(() => {})
  }, [])

  // The sidebar lives in the persistent dashboard layout, so refetch on
  // navigation — otherwise events created/renamed/deleted elsewhere go stale.
  useEffect(() => {
    let cancelled = false
    fetch('/api/events?mine=true', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setEvents(json.data ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pathname])

  const navClass = (
    active: boolean
  ) =>
    `flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-200 ease-out ${
      active
        ? 'border-border bg-accent text-background shadow-sm'
        : 'border-transparent text-foreground-soft hover:border-border hover:bg-panel-muted hover:text-foreground'
    }`

  return (
    <aside className="flex min-h-screen w-64 flex-col justify-between border-r-2 border-border bg-panel p-5 text-foreground lg:border-r-4">

      <div>

        {/* Brand */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border-2 border-border bg-panel-muted p-5 lg:border-4">

          <p className="flex items-center gap-2.5">
            <PlanetMark className="h-10 w-10 shrink-0" />
            <span className="leading-none">
              <span className="block font-display text-lg uppercase text-primary-red text-poster-outline">Cintel</span>
              <span className="block font-tech text-[10px] font-bold uppercase tracking-[0.25em] text-foreground-soft">Organizer</span>
            </span>
          </p>

          <div className="mt-5 rounded-xl border-2 border-border bg-panel p-3">

            <p className="truncate text-sm font-bold text-foreground">
              {profile?.full_name ??
                'Organizer'}
            </p>

            <p className="mt-1 truncate text-xs font-medium text-foreground-soft">
              {profile?.email ?? ''}
            </p>

          </div>

        </div>

        {/* Navigation */}
        <nav className="space-y-2">

          <Link
            href="/dashboard"
            className={navClass(
              pathname ===
                '/dashboard'
            )}
          >
            <LayoutDashboard
              size={18}
            />
            Dashboard
          </Link>

          <Link
            href="/dashboard/events/new"
            className={navClass(
              pathname ===
                '/dashboard/events/new'
            )}
          >
            <PlusCircle
              size={18}
            />
            New Event
          </Link>

          <Link
            href="/dashboard/contacts"
            className={navClass(
              pathname ===
                '/dashboard/contacts'
            )}
          >
            <Contact
              size={18}
            />
            Contacts
          </Link>

          <Link
            href="/"
            className={navClass(false)}
          >
            <Home
              size={18}
            />
            Home
          </Link>

        </nav>

        {/* Events */}
        <div className="mt-10">

          <div className="mb-4 flex items-center justify-between px-1 font-tech text-[10px] font-bold uppercase tracking-[0.22em] text-foreground-soft">

            <span>
              Managed Events
            </span>

            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-primary-yellow text-xs font-black text-[#121212]">
              {events.length}
            </span>

          </div>

          <div className="space-y-2">

            {events.map(
              (event) => (
                <Link
                  key={
                    event.id
                  }
                  href={`/dashboard/events/${event.id}`}
                  className="block rounded-xl border-2 border-border bg-panel-muted p-4 transition-all duration-200 ease-out hover:border-accent hover:bg-panel"
                >

                  <p className="truncate text-sm font-bold text-foreground">
                    {
                      event.title
                    }
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs font-medium text-foreground-soft">

                    <span className="max-w-[120px] truncate">
                      {
                        event.venue
                      }
                    </span>

                    <span className="rounded-full border-2 border-border bg-primary-yellow px-2 py-0.5 font-bold text-[#121212]">
                      {
                        event.confirmed_count
                      }
                    </span>

                  </div>

                </Link>
              )
            )}

          </div>

        </div>

      </div>

      {/* Theme + Logout */}
      <div className="space-y-3 pt-6">

        <div className="flex items-center justify-between rounded-xl border-2 border-border bg-panel-muted px-4 py-3 text-sm font-bold uppercase text-foreground-soft">
          <span>Theme</span>
          <ThemeToggle className="h-9 w-9" />
        </div>

        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-panel-muted px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground-soft transition-all duration-200 ease-out hover:border-brand hover:bg-brand hover:text-white"
        >

          <LogOut
            size={16}
          />

          Logout

        </button>

      </div>

    </aside>
  )
}
