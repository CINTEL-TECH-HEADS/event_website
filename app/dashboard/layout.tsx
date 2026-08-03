// Owner: FE2 - Dashboard shell layout with sidebar
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { getUserAccess } from '@/lib/auth/get-session'

// Never statically cache authenticated dashboard content
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-authoritative gate — a live session AND organizer access are required.
  // A logged-in participant is sent to their own portal, not the organizer shell.
  const access = await getUserAccess()
  if (!access) redirect('/login?redirect=/dashboard')
  if (!access.isOrganizer) redirect('/participant/portal')

  return (
    <div className="dashboard-theme-shell relative flex min-h-screen flex-col bg-[#07101d] text-slate-100 lg:flex-row">

      <SessionGuard />

      {/* Mobile top bar + drawer (< lg) */}
      <MobileNav />

      {/* Static sidebar (>= lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="app-main relative flex-1 bg-transparent px-4 py-4 sm:px-6 lg:px-8 lg:py-8">

        {/* Amber top glow — matches homescreen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]" />
        {/* Grid overlay — matches homescreen */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px,24px_24px]" />

        <div className="relative mx-auto max-w-7xl animate-in fade-in duration-500">
          <DashboardBreadcrumbs />
          {children}
        </div>

      </main>
    </div>
  )
}
