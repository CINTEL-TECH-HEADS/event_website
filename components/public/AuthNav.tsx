'use client'

// Session-aware nav for the public header.
//  - Logged out → the "Login" button (unchanged look).
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
      <Link href="/login" className="app-button-primary text-xs sm:text-sm">
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-panel text-foreground transition duration-200 hover:bg-panel-muted"
      >
        <CircleUser className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border-2 border-border bg-panel shadow-lg lg:border-4"
        >
          {me.email && (
            <div className="border-b-2 border-border px-4 py-3">
              <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">Signed in as</p>
              <p className="mt-0.5 truncate text-sm font-bold text-foreground">{me.email}</p>
            </div>
          )}

          <Link
            href={portalHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground transition duration-200 hover:bg-panel-muted"
          >
            <LayoutDashboard size={16} className="text-brand" strokeWidth={2.5} />
            {portalLabel}
          </Link>

          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground transition duration-200 hover:bg-panel-muted"
          >
            <Home size={16} className="text-brand" strokeWidth={2.5} />
            Home
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 border-t-2 border-border px-4 py-3 text-sm font-bold text-foreground transition duration-200 hover:bg-danger hover:text-white disabled:opacity-50"
          >
            <LogOut size={16} strokeWidth={2.5} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
