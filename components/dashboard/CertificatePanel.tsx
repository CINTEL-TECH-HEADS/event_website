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
    <section className=" border border-slate-200 bg-white p-6  transition-all duration-300 hover:-translate-y-0.5 ">

      {/* Header */}
      <div className="mb-5 flex items-start gap-3">

        <span className=" bg-[#EFF6FF] p-3 text-[#1E3A8A]">
          <FileBadge2 size={18} />
        </span>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
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