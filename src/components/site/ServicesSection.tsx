"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SiteContentData } from "@/lib/site-content";
import { SectionShell } from "@/components/site/SectionShell";
import { cn } from "@/lib/cn";
import servicesBg from "../../../assets/images/shared/servicios.png";
import servicesBgMobile from "../../../assets/images/shared/SO_VERTICAL.png";

type Props = { services: SiteContentData["services"] };
const RIBBON = [
  "SOULFUL BRANDING® EXPERIENCE",
  "SOULFUL BRANDING® EXPERIENCE",
  "SOULFUL BRANDING® EXPERIENCE",
] as const;
const DEFAULT_OPEN_INDEX = 2;
const SERVICE_CARD_DETAILS = [
  [
    "Esencia de marca",
    "Narrativa verbal",
    "Arquitectura conceptual",
    "Identidad visual",
    "Sistema de marca",
  ],
  [
    "Materiales complementarios que expandan la percepción y experiencia de la marca en el mercado, basados en la identidad actual.",
  ],
  ["Material complementario de carácter institucional, basado en la identidad actual."],
  ["Diseño y/o activación de sitio web, plataformas digitales, redes sociales, membresías, etc."],
] as const;
const DESKTOP_CARD_POSITIONS = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1",
  "md:col-start-1 md:row-start-2",
  "md:col-start-2 md:row-start-2",
] as const;

export function ServicesSection({ services }: Props) {
  const [open, setOpen] = useState<number | null>(DEFAULT_OPEN_INDEX);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.intersectionRatio < 0.35) {
          setOpen(DEFAULT_OPEN_INDEX);
        }
      },
      {
        threshold: [0, 0.35, 0.6],
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="servicios"
      ref={sectionRef}
      className="relative scroll-mt-24 overflow-hidden bg-white pt-7 pb-0 md:bg-white md:pt-0"
    >
      <SectionShell className="relative z-10 px-0 sm:px-0 lg:px-0 xl:px-0">
        <div className="md:hidden">
          <div className="relative min-h-[100svh] overflow-hidden bg-white">
            <h2 className="pointer-events-none absolute left-1/2 top-[22%] z-0 w-full -translate-x-1/2 -translate-y-1/2 text-center font-sans text-[clamp(4.6rem,24vw,7.4rem)] font-bold leading-[0.82] tracking-[-0.06em] text-brand-yellowPale">
              {services.backgroundWord}
            </h2>

            <div className="pointer-events-none absolute inset-x-[-16%] bottom-0 top-[6%] z-10 overflow-hidden" aria-hidden>
              <Image
                src={servicesBgMobile}
                alt=""
                fill
                sizes="100vw"
                className="object-contain object-bottom scale-[1.32]"
                priority={false}
              />
            </div>

            <div className="absolute inset-x-3 top-[42%] z-20 flex flex-col gap-2.5 pb-6">
              {services.items.map((item, i) => {
                const expanded = open === i;
                const detailLines = SERVICE_CARD_DETAILS[i] ?? [item.description];
                return (
                  <div
                    key={item.title}
                    onClick={() => setOpen(i)}
                    onFocus={() => setOpen(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen(i);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "group flex flex-col rounded-md border border-black/12 text-left transition",
                      expanded
                        ? "min-h-[9.4rem] bg-[#33322f] text-white shadow-[0_16px_30px_-20px_rgba(0,0,0,0.4)]"
                        : "min-h-[3.35rem] bg-white/92 text-black/88 shadow-[0_8px_18px_-16px_rgba(0,0,0,0.2)] backdrop-blur-[1px]",
                    )}
                  >
                    <div className="flex items-start gap-2.5 px-3.5 pt-2.5">
                      <span
                        className={cn(
                          "font-serif text-[0.95rem] font-semibold italic leading-none tabular-nums",
                          expanded ? "text-white" : "text-black/75",
                        )}
                      >
                        {i + 1}.
                      </span>
                      <span className="font-sans text-[0.92rem] font-bold uppercase leading-[1.15] tracking-[0.01em]">
                        {item.title}
                      </span>
                    </div>

                    {expanded && (
                      <>
                        {detailLines.length > 1 ? (
                          <ul className="space-y-1.5 px-3.5 pb-3 pt-2.5 text-[0.82rem] leading-[1.5] text-white/90">
                            {detailLines.map((line) => (
                              <li key={line} className="flex gap-1.5">
                                <span className="shrink-0">-</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="px-3.5 pb-3 pt-2.5 text-[0.82rem] leading-[1.5] text-white/90">
                            {detailLines[0]}
                          </p>
                        )}
                        <Link
                          href="/?etapa=Necesito%20evolucionar&formulario=contacto-evolucion#contacto"
                          className="px-3.5 pb-3.5 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-white"
                        >
                          +INFO
                        </Link>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div
            className="relative w-full"
            onMouseLeave={() => setOpen(DEFAULT_OPEN_INDEX)}
          >
            <div className="relative min-h-[calc(100vh-2.5rem)] overflow-hidden bg-white">
              <h2 className="pointer-events-none absolute left-1/2 top-[12%] z-0 w-full -translate-x-1/2 -translate-y-1/2 text-center font-sans text-[clamp(7rem,16vw,12rem)] font-bold leading-[0.82] tracking-[-0.06em] text-brand-yellowPale">
                {services.backgroundWord}
              </h2>

              <div className="absolute inset-x-[-8%] bottom-0 top-[3%] z-10 lg:inset-x-[-10%] xl:inset-x-[-12%]">
                <Image
                  src={servicesBg}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-contain object-bottom scale-[1.38] lg:scale-[1.48] xl:scale-[1.58]"
                  priority={false}
                />
              </div>

              <div className="absolute inset-x-[5.5%] bottom-[4.5rem] z-20 grid grid-cols-2 items-end gap-x-5 gap-y-4 lg:inset-x-[7%] lg:bottom-[5.5rem] lg:gap-x-6 lg:gap-y-5 xl:inset-x-[9%]">
                {services.items.map((item, i) => {
                  const expanded = open === i;
                  const detailLines = SERVICE_CARD_DETAILS[i] ?? [item.description];
                  return (
                    <div
                      key={item.title}
                      onMouseEnter={() => setOpen(i)}
                      onFocus={() => setOpen(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpen(i);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-current={expanded ? "true" : undefined}
                      className={cn(
                        "group relative z-10 flex self-start cursor-pointer flex-col rounded-[14px] border text-left shadow-[0_10px_28px_-18px_rgba(0,0,0,0.25)] transition outline-none",
                        expanded
                          ? "min-h-[15rem] border-black/20 bg-[#353432] text-white shadow-[0_20px_42px_-22px_rgba(0,0,0,0.5)]"
                          : "min-h-[5.2rem] border-black/12 bg-[#f8f6ee] text-black/92",
                        DESKTOP_CARD_POSITIONS[i] ?? "",
                      )}
                    >
                      <div className="flex items-start gap-3 px-5 pt-4">
                        <span
                          className={cn(
                            "font-serif text-[1rem] font-semibold italic leading-none tabular-nums",
                            expanded ? "text-white" : "text-black",
                          )}
                        >
                          {i + 1}.
                        </span>
                        <span className="font-sans text-[1.05rem] font-bold uppercase leading-[1.05] tracking-[0.01em] lg:text-[1.1rem]">
                          {item.title}
                        </span>
                      </div>

                      {expanded && (
                        <>
                          {detailLines.length > 1 ? (
                            <ul className="px-5 pt-5 text-[0.95rem] leading-[1.45] text-white/92 lg:max-w-[26ch]">
                              {detailLines.map((line) => (
                                <li key={line} className="flex gap-2">
                                  <span className="shrink-0">-</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="px-5 pt-5 text-[0.95rem] leading-[1.5] text-white/92 lg:max-w-[26ch]">
                              {detailLines[0]}
                            </p>
                          )}
                          <Link
                            href="/?etapa=Necesito%20evolucionar&formulario=contacto-evolucion#contacto"
                            className="mt-auto px-5 pb-5 pt-6 text-[0.95rem] font-bold uppercase tracking-[0.08em] text-white transition hover:text-white/80"
                          >
                            +INFO
                          </Link>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SectionShell>
      <div className="relative left-1/2 z-10 mt-0 hidden w-screen max-w-[100vw] -translate-x-1/2 bg-brand-yellowPale px-3 py-2 md:block">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1 text-center font-sans text-[8px] font-bold uppercase leading-tight tracking-[0.12em] text-brand-navy sm:flex-row sm:justify-between sm:gap-4 sm:text-[9px] sm:px-6 md:px-10 md:text-[10px] lg:px-14">
          {RIBBON.map((line, i) => (
            <span key={`ribbon-${i}`} className={cn("min-w-0 flex-1")}>
              {line}
            </span>
          ))}
        </div>
      </div>

    </section>
  );
}
