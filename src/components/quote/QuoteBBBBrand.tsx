"use client";

import { BBB_BRAND_IMAGE } from "@/lib/quote-bbb-brand";

type QuoteBBBBrandProps = {
  variant?: "portal" | "preview";
};

export function QuoteBBBBrand({ variant = "portal" }: QuoteBBBBrandProps) {
  const isPortal = variant === "portal";

  return (
    <figure className={isPortal ? "m-0 leading-none w-full max-w-none" : "m-0 leading-none w-full max-w-none -mx-1"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BBB_BRAND_IMAGE.src}
        alt={BBB_BRAND_IMAGE.alt}
        width={1200}
        height={2400}
        className="block w-full h-auto max-w-none"
        loading="eager"
        decoding="sync"
        sizes="100vw"
      />
    </figure>
  );
}
