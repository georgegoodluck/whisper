import Image from 'next/image'

export function Logo({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Whisper"
      width={size}
      height={size}
      priority
      className={className}
    />
  )
}
