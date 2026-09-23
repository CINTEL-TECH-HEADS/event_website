'use client'

// Mobile top bar + slide-in drawer for the dashboard (< lg). The full Sidebar is
// hidden on mobile and shown inside the drawer; the drawer auto-closes on route
// change. On >= lg this renders nothing (the static sidebar is used instead).

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { PlanetMark } from '@/components/brand/PlanetMark'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on navigation.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-border bg-panel px-4 py-3">
        <span className="flex items-center gap-2 font-display text-sm uppercase tracking-tight text-poster-outline text-primary-red">
          <PlanetMark className="h-6 w-6 shrink-0" />
          Cintel Admin
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-panel-muted text-foreground shadow-sm transition-all duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#14120F]/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto border-r-2 border-border sm:border-r-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-panel-muted text-foreground shadow-sm transition-all duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <X size={18} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  )
}
