"use client";

import { BBB_DECK_SLIDES } from "@/lib/quote-bbb-deck";

type QuoteBBBDeckProps = {
  /** En admin la vista previa puede ir en columna estrecha */
  variant?: "portal" | "preview";
};

export function QuoteBBBDeck({ variant = "portal" }: QuoteBBBDeckProps) {
  const isPortal = variant === "portal";

  return (
    <div
      className={
        isPortal
          ? "bbb-deck w-full max-w-none"
          : "bbb-deck w-full max-w-none -mx-1"
      }
    >
      {BBB_DECK_SLIDES.map((slide, index) => (
        <figure key={slide.src} className="m-0 leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            width={1200}
            height={1600}
            className="block w-full h-auto max-w-none"
            loading={index < 2 ? "eager" : "lazy"}
            decoding={index < 2 ? "sync" : "async"}
            sizes={isPortal ? "100vw" : "100vw"}
          />
        </figure>
      ))}
    </div>
  );
}
