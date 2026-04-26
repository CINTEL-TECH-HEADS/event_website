'use client'

import { motion } from 'framer-motion'

interface Props {
  label: string
  name: string
}

export default function LuxuryTextarea({
  label,
  name,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative"
    >
      <textarea
        name={name}
        rows={5}
        placeholder=" "
        className="peer w-full rounded-2xl border border-[#243B72] bg-[#081028] px-4 pt-6 pb-3 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20"
      />

      <label className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#F5E62D] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs">
        {label}
      </label>
    </motion.div>
  )
}