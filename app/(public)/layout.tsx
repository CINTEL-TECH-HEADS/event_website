import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/public/ThemeToggle'


export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
     <div className="public-theme-shell relative flex min-h-screen flex-col overflow-hidden bg-[#07101d] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px,24px_24px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101d]/94 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-amber-300/40 bg-amber-300 text-sm font-bold text-slate-950">
               <Image
                  src="/Logo.png"
                  alt="Cintel Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-white">CINTEL EVENTS</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PUBLIC RELEASE</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/events"
              className="border border-transparent px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white hover:shadow-[0_0_0_1px_rgba(252,211,77,0.12),0_0_24px_rgba(250,204,21,0.18)]"
            >
              Events
            </Link>
            <Link
              href="/resend"
              className="border border-transparent px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white"
            >
              Resend
            </Link>
            <Link
              href="/certificate"
              className="border border-transparent px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white"
            >
              Certificate
            </Link>
            <Link
              href="/login"
              className="public-force-white border border-amber-300/35 bg-amber-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Login
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-white/10 bg-[#07101d]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Cintel Student Association</p>
        </div>
      </footer>
    </div>
  )
}
//Added
