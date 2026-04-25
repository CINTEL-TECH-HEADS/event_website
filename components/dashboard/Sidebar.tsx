// Owner: FE2

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  TerminalSquare
} from 'lucide-react'

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
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside className="w-72 border-r border-white/5 bg-[#020617] min-h-screen p-5 flex flex-col justify-between z-20">
      <div>
        {/* Brand */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-black/40 p-5 shadow-[0_0_20px_rgba(16,185,129,0.03)] focus-within:border-amber-500/20 transition-all app-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[30px] rounded-full pointer-events-none" />
          
          <h1 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <TerminalSquare size={18} className="text-amber-500" />
            Cintel Admin
          </h1>
          <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-slate-500 font-bold">
            Organizer Workspace
          </p>

          <div className="mt-5 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-md">
            <p className="font-semibold text-amber-400 tracking-wide text-sm">
              {profile?.full_name ?? 'ROOT_USER'}
            </p>
            <p className="text-xs text-slate-500 truncate font-mono mt-0.5">
              {profile?.email ?? 'sysadmin@cintel.in'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 app-fade-in-delayed">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all text-sm font-semibold tracking-wide ${
              pathname === '/dashboard'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/events/new"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all text-sm font-semibold tracking-wide ${
              pathname === '/dashboard/events/new'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <PlusCircle size={18} />
            <span>New Event</span>
          </Link>
        </nav>

        {/* Events */}
        <div className="mt-10 app-fade-in-delayed">
          <div className="mb-4 flex items-center justify-between text-[0.65rem] tracking-widest uppercase font-bold text-slate-500 px-1">
            <span>Assigned Target Data</span>
            <span className="flex items-center justify-center w-5 h-5 rounded bg-white/5 text-amber-500 border border-white/5">
              {events.length}
            </span>
          </div>

          <div className="space-y-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block rounded-xl border border-white/5 bg-black/20 p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
              >
                <p className="font-semibold text-slate-300 group-hover:text-amber-400 transition-colors text-sm truncate">
                  {event.title}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="truncate max-w-[120px]">{event.venue}</span>
                  <span className="text-amber-500/70 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded ml-2">
                    {event.confirmed_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="pt-6 app-fade-in-delayed mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all text-sm font-bold tracking-wide"
        >
          <LogOut size={16} />
          Terminate Session
        </button>
      </div>
    </aside>
  )
}