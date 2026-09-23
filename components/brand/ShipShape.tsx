import Image from 'next/image'
import rocket from '@/components/public/images/rocket.png'

type Props = {
  className?: string
  /** unused now that real illustrated art is used, kept for call-site compat */
  fill?: string
  stroke?: string
}

/**
 * The official illustrated rocket — used as a hero/banner decoration.
 * Use sparingly (once per scene). Size via className.
 */
const HAS_POSITION = /\b(absolute|fixed|sticky|relative)\b/

export function ShipShape({ className = '' }: Props) {
  const position = HAS_POSITION.test(className) ? '' : 'relative'
  return (
    <span className={`${position} inline-block ${className}`}>
      <Image src={rocket} alt="" fill sizes="400px" style={{ objectFit: 'contain' }} />
    </span>
  )
}
