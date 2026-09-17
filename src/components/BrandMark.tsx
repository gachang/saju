import Image from "next/image";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/figma-final/brand-mark.png"
      alt="성덕기니"
      width={72}
      height={72}
      sizes="72px"
      className={`mix-blend-lighten ${className}`}
      priority
    />
  );
}
