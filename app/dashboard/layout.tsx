// Owner: FE2 - Dashboard shell layout with sidebar
// Auth is enforced by middleware.ts - no need to re-check here
import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="app-main flex-1 bg-transparent px-4 py-4 sm:px-6 lg:px-8 lg:py-8">

        {/* Top Glow Accent */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(30,58,138,0.10),transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>

      </main>
    </div>
  )
}