import Image from 'next/image'
import { siteConfig } from '@/lib/site-config'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

/** Shared gorillaz tattoo art wordmark, used by the navbar and footer. */
export function Logo({ className = 'h-14 w-auto', width = 220, height = 70 }: LogoProps) {
  return (
    <Image
      src="/logo/gorillaz-logo-white.svg"
      alt={`${siteConfig.name} logo`}
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
