"use client";

import { SOUL_BRAND_MAP_IMAGE } from "@/lib/quote-soul-brand-map";

type QuoteSoulBrandMapProps = {
  variant?: "portal" | "preview";
};

export function QuoteSoulBrandMap({ variant = "portal" }: QuoteSoulBrandMapProps) {
  const isPortal = variant === "portal";

  return (
    <figure className={isPortal ? "m-0 leading-none w-full max-w-none" : "m-0 leading-none w-full max-w-none -mx-1"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SOUL_BRAND_MAP_IMAGE.src}
        alt={SOUL_BRAND_MAP_IMAGE.alt}
        width={1200}
        height={1600}
        className="block w-full h-auto max-w-none"
        loading="eager"
        decoding="sync"
        sizes="100vw"
      />
    </figure>
  );
}
