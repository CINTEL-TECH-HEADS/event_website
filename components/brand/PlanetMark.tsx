import Image from 'next/image'
import logo from '@/components/public/images/cintel_icon.png'

type Props = {
  className?: string
}

/**
 * The Cintel brand icon — a cropped square icon mark from the official
 * illustrated logo (profile head + gold constellation crown + starburst).
 * Drop-in square aspect, so it works anywhere a compact emblem is needed
 * (nav, sidebar, footer, loading states).
 */
const HAS_POSITION = /\b(absolute|fixed|sticky|relative)\b/

export function PlanetMark({ className = '' }: Props) {
  const position = HAS_POSITION.test(className) ? '' : 'relative'
  return (
    <span className={`${position} inline-block ${className}`}>
      <Image src={logo} alt="Cintel" fill sizes="120px" style={{ objectFit: 'contain' }} />
    </span>
  )
}
