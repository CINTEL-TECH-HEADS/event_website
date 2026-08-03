'use client'

// Mobile top bar + slide-in drawer for the dashboard (< lg). The full Sidebar is
// hidden on mobile and shown inside the drawer; the drawer auto-closes on route
// change. On >= lg this renders nothing (the static sidebar is used instead).

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ShieldCheck } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'

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
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#243B72] bg-[#0B1736] px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <ShieldCheck size={18} className="text-[#F5E62D]" />
          Cintel Admin
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center border border-[#243B72] bg-[#10224A] text-slate-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center border border-[#243B72] bg-[#10224A] text-slate-200"
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
