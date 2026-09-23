'use client'

import { motion } from 'framer-motion'
import { InputHTMLAttributes } from 'react'

interface Props
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function LuxuryInput({
  label,
  ...props
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative"
    >
      <input
        {...props}
        placeholder=" "
        className="peer w-full rounded-xl border-2 border-border bg-panel px-4 pt-6 pb-2 font-medium text-foreground outline-none transition-shadow duration-200 ease-out focus:shadow-[3px_3px_0px_0px] focus:shadow-brand"
      />

      <label className="pointer-events-none absolute left-4 top-4 font-tech text-sm font-semibold uppercase tracking-wide text-foreground-soft transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-brand peer-focus:tracking-widest peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:tracking-widest">
        {label}
      </label>
    </motion.div>
  )
}