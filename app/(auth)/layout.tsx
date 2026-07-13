// Owner: FE2
import { ThemeToggle } from '@/components/public/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-theme-shell min-h-screen bg-[#030507] w-full m-0 p-0 overflow-hidden">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </div>
  )
}
