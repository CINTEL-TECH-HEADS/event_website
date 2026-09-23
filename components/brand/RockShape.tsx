import Image from 'next/image'
import pink from '@/components/public/images/pink_astroid.png'
import yellow from '@/components/public/images/yellow_astroid.png'
import purple from '@/components/public/images/purple_astroid.png'

type Props = {
  className?: string
  /** unused now that real illustrated art is used, kept for call-site compat */
  fill?: string
  stroke?: string
  /** picks between the 3 illustrated asteroid colorways so a cluster doesn't repeat one */
  variant?: 1 | 2 | 3
}

const IMAGES = { 1: pink, 2: yellow, 3: purple }

/**
 * A jagged illustrated asteroid — one of the official brand asteroid
 * renders (crimson/gold/purple), used for scattered background decoration,
 * card corner accents, empty states, etc. Size/rotate via className.
 */
const HAS_POSITION = /\b(absolute|fixed|sticky|relative)\b/

export function RockShape({ className = '', variant = 1 }: Props) {
  const position = HAS_POSITION.test(className) ? '' : 'relative'
  return (
    <span className={`${position} inline-block ${className}`}>
      <Image src={IMAGES[variant] ?? IMAGES[1]} alt="" fill sizes="200px" style={{ objectFit: 'contain' }} />
    </span>
  )
}
