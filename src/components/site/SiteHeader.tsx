"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/lib/site-content";
import { cn } from "@/lib/cn";

type Props = {
  nav: NavItem[];
};

export function SiteHeader({ nav }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const displayNav = nav.map((item) =>
    item.label.toLowerCase() === "portfolio" || item.href === "/portfolio"
      ? { ...item, label: "Brand´s" }
      : item,
  );
  const resolveHref = (href: string) => {
    if (!href.startsWith("#")) return href;
    return pathname === "/" ? href : `/${href}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#333130]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:py-3 lg:px-10 xl:px-14 lg:py-4">
        <Link href="/" className="flex shrink-0 items-center self-center" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logoclaro.png"
            alt="Soulful Branding"
            width={320}
            height={72}
            className="h-9 w-auto max-w-[min(74vw,12.8rem)] object-contain object-left sm:h-10 sm:max-w-[14.5rem] md:h-10 md:max-w-[15.5rem] lg:h-10 lg:max-w-[16.8rem] xl:h-11 xl:max-w-[18rem]"
            decoding="async"
            fetchPriority="high"
          />
        </Link>
        <nav className="hidden items-center gap-7 md:flex lg:gap-10">
          {displayNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={resolveHref(item.href)}
              className="leading-none text-[11px] font-semibold tracking-[0.03em] text-white/95 transition hover:text-white/70 lg:text-[1.05rem]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-expanded={open}
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
          <span className="mt-1.5 block h-0.5 w-6 bg-white" />
        </button>
      </div>
      <div
        className={cn(
          "border-t border-white/10 bg-[#333130] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-3">
          {displayNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={resolveHref(item.href)}
              className="rounded-md px-3 py-2.5 text-sm font-medium tracking-[0.02em] text-white/95 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
