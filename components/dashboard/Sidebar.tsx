// Owner: FE2

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Home,
  Contact,
} from 'lucide-react'
import { ThemeToggle } from '@/components/public/ThemeToggle'

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

interface SidebarProps {
  profile?: Profile
  events?: EventWithStats[]
}

export function Sidebar({
  profile,
  events = [],
}: SidebarProps) {
  const pathname =
    usePathname()

  const navClass = (
    active: boolean
  ) =>
    `flex items-center gap-3 border px-4 py-3 text-sm font-semibold transition  ${
      active
        ? 'border-[#FFF27A] bg-[#F5E62D] text-[#0B1736] '
        : 'border-transparent text-slate-300 hover:border-[#243B72] hover:bg-[#132B59] hover:text-white'
    }`

  return (
    <aside className="flex min-h-screen w-64 flex-col justify-between border-r border-[#243B72] bg-[#0B1736] p-5 text-white ">

      <div>

        {/* Brand */}
        <div className="mb-8 border border-[#2A4580] bg-[#10224A] p-5 ">

          <h1 className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck
              size={18}
              className="text-[#F5E62D]"
            />
            Cintel Admin
          </h1>

          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Organizer Workspace
          </p>

          <div className="mt-5 border border-[#243B72] bg-[#0B1736] p-3 ">

            <p className="text-sm font-semibold text-white">
              {profile?.full_name ??
                'Organizer'}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {profile?.email ??
                'admin@cintel.in'}
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

          <div className="mb-4 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.18em] text-[#F5E62D]">

            <span>
              Managed Events
            </span>

            <span className="flex h-6 w-6 items-center justify-center border border-[#FFF27A] bg-[#F5E62D] text-xs font-bold text-[#0B1736] ">
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
                  className="block border border-[#243B72] bg-[#10224A] p-4 transition  hover:border-[#F5E62D] hover:bg-[#132B59]"
                >

                  <p className="truncate text-sm font-semibold text-white">
                    {
                      event.title
                    }
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">

                    <span className="max-w-[120px] truncate">
                      {
                        event.venue
                      }
                    </span>

                    <span className="border border-[#FFF27A] bg-[#F5E62D] px-2 py-0.5 font-semibold text-[#0B1736] ">
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

        <div className="flex items-center justify-between border border-[#243B72] bg-[#10224A] px-4 py-3 text-sm font-semibold text-slate-300 ">
          <span>Theme</span>
          <ThemeToggle className="h-9 w-9" />
        </div>

        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="flex w-full items-center justify-center gap-2 border border-[#243B72] bg-[#10224A] px-4 py-3 text-sm font-semibold text-slate-300 transition  hover:border-red-500 hover:bg-red-500 hover:text-white"
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
