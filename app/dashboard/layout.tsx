// Owner: FE2 - Dashboard shell layout with sidebar
// Auth is enforced by middleware.ts - no need to re-check here
import { Sidebar } from '@/components/dashboard/Sidebar'
import { SessionGuard } from '@/components/auth/SessionGuard'

// Never statically cache authenticated dashboard content
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-theme-shell relative flex min-h-screen flex-col bg-[#07101d] text-slate-100 lg:flex-row">

      <SessionGuard />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="app-main relative flex-1 bg-transparent px-4 py-4 sm:px-6 lg:px-8 lg:py-8">

        {/* Amber top glow — matches homescreen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]" />
        {/* Grid overlay — matches homescreen */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px,24px_24px]" />

        <div className="relative mx-auto max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>

      </main>
    </div>
  )
}
