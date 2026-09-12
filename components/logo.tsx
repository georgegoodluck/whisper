import Image from "next/image";

export function Logo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.svg"
      alt="Whisper"
      width={size}
      height={size}
      priority
      className={className}
    />
  );
}
