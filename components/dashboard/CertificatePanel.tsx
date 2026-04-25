// Owner: FE2
import { FileBadge2 } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  children?: React.ReactNode
}

export function CertificatePanel({
  title = 'Certificates',
  description = 'Template upload, generation, and release belong together in one workflow.',
  children,
}: Props) {
  return (
    <section className="app-panel rounded-[1.8rem] p-6 hover:shadow-xl transition-all duration-300">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-3 text-brand-600">
          <FileBadge2 size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
