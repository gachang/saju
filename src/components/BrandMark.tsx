import Image from "next/image";

/** The 72px Figma logo rebuilt from its original vector layers. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="성덕기니"
      className={`relative size-[72px] ${className}`}
    >
      <div className="absolute top-[10.49px] left-1/2 size-[51px] -translate-x-1/2">
        <Image src="/figma-final/brand-base.svg" alt="" fill sizes="51px" />
      </div>

      <div className="absolute top-[2.77px] left-1/2 flex size-[66.44px] -translate-x-1/2 items-center justify-center">
        <div className="relative size-[47px] -rotate-[43.34deg]">
          <Image src="/figma-final/brand-ring-a.svg" alt="" fill sizes="47px" />
        </div>
      </div>

      <div className="absolute top-[7.49px] left-[calc(50%+15.52px)] flex size-[18.04px] -translate-x-1/2 items-center justify-center">
        <div className="relative size-[12.761px] -rotate-[43.34deg]">
          <Image src="/figma-final/brand-orbit-dot-a.svg" alt="" fill sizes="13px" />
        </div>
      </div>

      <div className="absolute top-[44.49px] left-[calc(50%-10.65px)] flex size-[23.695px] -translate-x-1/2 items-center justify-center">
        <div className="relative size-[16.762px] -rotate-[43.34deg]">
          <Image src="/figma-final/brand-ring-b.svg" alt="" fill sizes="17px" />
        </div>
      </div>

      <div className="absolute top-[48.49px] left-[calc(50%-18.11px)] flex size-[10.787px] -translate-x-1/2 items-center justify-center">
        <div className="relative size-[7.631px] -rotate-[43.34deg]">
          <Image src="/figma-final/brand-orbit-dot-b.svg" alt="" fill sizes="8px" />
        </div>
      </div>

      <div className="absolute top-0 left-1/2 flex size-[71.978px] -translate-x-1/2 items-center justify-center">
        <div className="relative size-[51px] rotate-[41.34deg]">
          <Image src="/figma-final/brand-ring-c.svg" alt="" fill sizes="51px" />
        </div>
      </div>

      <span className="absolute top-[16.49px] left-[35.99px] -translate-x-1/2 text-center font-hambak text-[15.317px] leading-[20px] whitespace-nowrap text-[#f3f04e]">
        성덕
        <br />
        기니
      </span>
    </div>
  );
}
