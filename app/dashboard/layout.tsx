// Owner: FE2 - Dashboard shell layout with sidebar
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { getUserAccess } from '@/lib/auth/get-session'
import { Starburst } from '@/components/brand/Starburst'

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
    <div className="dashboard-theme-shell relative flex min-h-screen flex-col bg-background text-foreground lg:flex-row">

      <SessionGuard />

      {/* Mobile top bar + drawer (< lg) */}
      <MobileNav />

      {/* Static sidebar (>= lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="app-main relative flex-1 bg-background px-4 py-4 sm:px-6 lg:px-8 lg:py-8">

        {/* Faint corner starburst — restrained poster accent, not a scene */}
        <div className="pointer-events-none absolute right-6 top-6 hidden opacity-[0.07] lg:block">
          <Starburst rings color="rgb(var(--border))" className="h-32 w-32" />
        </div>

        <div className="relative mx-auto max-w-7xl animate-fade-in">
          <DashboardBreadcrumbs />
          {children}
        </div>

      </main>
    </div>
  )
}
