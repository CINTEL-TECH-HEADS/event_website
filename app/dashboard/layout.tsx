// Owner: FE2 - Dashboard shell layout with sidebar
// Auth is enforced by middleware.ts - no need to re-check here
import { Sidebar } from '@/components/dashboard/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="app-main flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl app-fade-in">{children}</div>
      </main>
    </div>
  )
}
