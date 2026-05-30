"use client";

import { BBB_DECK_SLIDES } from "@/lib/quote-bbb-deck";

export function QuoteBBBDeck() {
  return (
    <div className="bbb-deck -mx-2 sm:-mx-4">
      {BBB_DECK_SLIDES.map((slide, index) => (
        <figure key={slide.src} className="m-0 leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={slide.alt}
            width={1200}
            height={1600}
            className="block w-full h-auto"
            loading={index < 2 ? "eager" : "lazy"}
            decoding={index < 2 ? "sync" : "async"}
          />
        </figure>
      ))}
    </div>
  );
}
