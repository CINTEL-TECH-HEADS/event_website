// Owner: FE2
import { FileBadge2 } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  children?: React.ReactNode
}

export function CertificatePanel({
  title = 'Certificates',
  description = 'Upload templates, generate certificates, and release them through one clean workflow.',
  children,
}: Props) {
  return (
    <section className="app-panel-muted p-6 transition-all duration-300 hover:-translate-y-0.5">

      {/* Header */}
      <div className="mb-5 flex items-start gap-3">

        <span className="flex items-center justify-center rounded-xl border-2 border-border bg-primary-blue p-3 text-white">
          <FileBadge2 size={18} />
        </span>

        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
            {title}
          </h2>

          <p className="mt-1 text-sm font-medium leading-6 text-foreground-soft">
            {description}
          </p>
        </div>

      </div>

      {/* Body */}
      <div className="space-y-4">
        {children}
      </div>

    </section>
  )
}