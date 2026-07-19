'use client'

// Session-aware nav for the public header.
//  - Logged out → the amber "Login" button (unchanged look).
//  - Logged in  → a profile icon that opens a dropdown with a link to the
//    user's own portal (Dashboard / My Events), Home, and Sign out.
// State comes from GET /api/auth/me (no-store), so the public layout can stay
// a static server component.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CircleUser, Home, LayoutDashboard, LogOut } from 'lucide-react'

type Me = {
  authenticated: boolean
  email: string | null
  role: 'superadmin' | 'organizer' | 'participant' | null
  home: string | null
}

export function AuthNav() {
  const [me, setMe] = useState<Me | null>(null)
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: Me) => {
        if (active) setMe(data)
      })
      .catch(() => {
        if (active) setMe({ authenticated: false, email: null, role: null, home: null })
      })
    return () => {
      active = false
    }
  }, [])

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/'
    }
  }

  // Avoid a Login→icon flash: render nothing until we know the session.
  if (me === null) {
    return <span className="inline-flex h-10 w-[92px]" aria-hidden />
  }

  if (!me.authenticated) {
    return (
      <Link
        href="/login"
        className="public-force-white border border-amber-300/35 bg-amber-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-200"
      >
        Login
      </Link>
    )
  }

  const isOrganizer = me.role === 'organizer' || me.role === 'superadmin'
  const portalHref = me.home ?? (isOrganizer ? '/dashboard' : '/participant/portal')
  const portalLabel = isOrganizer ? 'Dashboard' : 'My Events'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="public-theme-toggle inline-flex h-10 w-10 items-center justify-center border border-white/15 bg-white/5 text-slate-200 transition hover:border-amber-300/25 hover:bg-white/10 hover:text-white"
      >
        <CircleUser className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-60 border border-white/10 bg-[#0a1629] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
          {me.email && (
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{me.email}</p>
            </div>
          )}

          <Link
            href={portalHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard size={16} className="text-amber-300" />
            {portalLabel}
          </Link>

          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            <Home size={16} className="text-amber-300" />
            Home
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            <LogOut size={16} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
