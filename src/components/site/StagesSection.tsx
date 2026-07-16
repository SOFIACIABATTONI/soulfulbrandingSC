"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteContentData, StageItem } from "@/lib/site-content";
import { SectionImage } from "@/components/site/SectionImage";
import { SectionShell } from "@/components/site/SectionShell";
import { cn } from "@/lib/cn";

type Props = { stages: SiteContentData["stages"] };

const RIBBON = [
  "International creative studio",
  "High end expertise",
  "Servicios exclusivos 1:1",
] as const;

const CTA_PINK = "bg-[#E93675] hover:bg-[#d42f68]";

function stageCardShell(style: StageItem["style"]) {
  switch (style) {
    case "navy":
      return "bg-brand-navy text-white shadow-[0_10px_28px_-12px_rgba(19,25,69,0.35)]";
    case "outlinePink":
      return "border border-neutral-300/90 bg-white text-[#E93675] shadow-[0_10px_28px_-12px_rgba(19,25,69,0.16)]";
    default:
      return "bg-brand-yellowPale text-brand-navy shadow-[0_10px_28px_-12px_rgba(19,25,69,0.14)]";
  }
}

type ModalStage = { title: string; subtitle: string; infoHref: string };

function StageModal({ stage, onClose }: { stage: ModalStage; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" aria-hidden />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-6 shadow-[0_32px_64px_-16px_rgba(19,25,69,0.45)] transition-all duration-220",
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cerrar */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-brand-navy/40 transition hover:bg-neutral-100 hover:text-brand-navy"
          aria-label="Cerrar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <p className="pr-6 font-serif text-[1.35rem] font-semibold italic leading-tight text-brand-navy">
          {stage.title}
        </p>
        <p className="mt-3 text-[0.9rem] leading-relaxed text-brand-navy/75">
          {stage.subtitle}
        </p>

        <Link
          href={stage.infoHref}
          scroll
          onClick={handleClose}
          className={cn(
            "mt-6 inline-flex w-full items-center justify-center rounded-xl py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition",
            CTA_PINK,
          )}
        >
          Contactar
        </Link>
      </div>
    </div>
  );
}

function StageCard({ s, onOpenModal }: { s: StageItem; onOpenModal: (stage: ModalStage) => void }) {
  const style = s.style ?? "yellow";
  const infoHref = `/?etapa=${encodeURIComponent(s.title)}#contacto`;
  const showInfo = s.showInfo !== false;
  const hasSubtitle = !!s.subtitle?.trim();

  function handleInfo(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (hasSubtitle) {
      onOpenModal({ title: s.title, subtitle: s.subtitle!, infoHref });
    } else {
      window.location.href = infoHref;
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl sm:flex-row sm:items-stretch",
        stageCardShell(style),
      )}
    >
      <div
        className={cn(
          "min-w-0 flex-1 px-4 py-4 text-left sm:px-6 sm:py-5",
          style === "outlinePink" && "text-[#E93675]",
        )}
      >
        <div className="flex items-start justify-between gap-3 sm:contents">
          <p className="min-w-0 flex-1 text-base font-bold leading-snug sm:text-lg">{s.title}</p>
          {showInfo && (
            <button
              onClick={handleInfo}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white transition active:opacity-90 sm:hidden",
                CTA_PINK,
              )}
            >
              + INFO
            </button>
          )}
        </div>

        <p
          className={cn(
            "mt-2 text-sm font-medium leading-snug sm:text-[0.9375rem]",
            style === "navy" && "text-white/92",
            style === "outlinePink" && "text-[#E93675]/95",
            style === "yellow" && "text-brand-navy",
          )}
        >
          {s.description}
        </p>
      </div>

      {showInfo && (
        <button
          onClick={handleInfo}
          className={cn(
            "hidden min-h-[3rem] shrink-0 items-center justify-center whitespace-nowrap px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition sm:inline-flex sm:w-[5.75rem] sm:min-h-0 sm:px-3 sm:py-0",
            CTA_PINK,
            style === "navy" && "sm:border-l sm:border-white/25",
            style === "yellow" && "sm:border-l sm:border-black/5",
            style === "outlinePink" && "sm:border-l sm:border-neutral-200",
          )}
        >
          + INFO
        </button>
      )}
    </div>
  );
}

export function StagesSection({ stages }: Props) {
  const [modalStage, setModalStage] = useState<ModalStage | null>(null);

  return (
    <section
      id="etapas"
      className="relative scroll-mt-24 overflow-hidden pt-12 pb-0 md:pt-16 md:[--stages-ribbon-height:2.75rem] lg:pt-20 lg:[--stages-ribbon-height:3rem]"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-x-0 top-0 h-1/2 min-h-[210px] bg-cover bg-center md:min-h-[180px]"
          style={{ backgroundImage: "url(/media/sky-band.png)" }}
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 min-h-[200px] bg-cover bg-[center_top]"
          style={{ backgroundImage: "url(/media/paper-texture-site.png)" }}
          aria-hidden
        />
      </div>

      <SectionShell className="relative z-10">
        <h2 className="relative z-10 mx-auto max-w-[14ch] text-center font-sans text-[clamp(1.85rem,8.4vw,3.1rem)] font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(19,25,69,0.25)] sm:max-w-[18ch] md:max-w-none md:text-[clamp(1.65rem,3.2vw,2.65rem)] md:leading-[1.18]">
          {stages.heading}
        </h2>

        <div className="relative mt-7 pb-[5rem] md:mt-12 md:pb-[7.5rem] lg:mt-14 lg:pb-[8.5rem]">
          <div className="relative z-10 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] md:items-stretch md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:gap-8">
            {/* Cards: columna izquierda */}
            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4 md:mx-0 md:max-w-none md:gap-4 lg:gap-5">
              {stages.stages.map((s) => (
                <StageCard key={s.title} s={s} onOpenModal={setModalStage} />
              ))}
            </div>

            {/* Columna derecha: misma altura que las cards */}
            <div className="relative hidden md:block">
              <div className="relative h-full min-h-full rounded-[24px] bg-white shadow-[0_20px_48px_-16px_rgba(19,25,69,0.22)] lg:rounded-[28px]" />
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell className="pointer-events-none absolute inset-x-0 bottom-[var(--stages-ribbon-height)] z-[11] hidden md:block">
        <div className="ml-auto w-[41.5%] lg:w-[39.5%]">
          <SectionImage
            src={stages.imageUrl}
            alt=""
            className="relative h-[25rem] w-full lg:h-[28rem] xl:h-[30rem]"
            imgClassName="object-contain object-center"
          />
        </div>
      </SectionShell>

      {/* Wordmark: z-[2] = detrás de la franja amarilla (z-[5]), asomándose desde abajo */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-4 sm:px-5 md:bottom-[var(--stages-ribbon-height)] md:px-6 lg:px-8"
        aria-hidden
      >
        <Image
          src="/brand/soulful-branding.svg"
          alt=""
          width={1600}
          height={360}
          className="mx-auto h-auto w-full max-w-full origin-bottom object-contain object-bottom opacity-[0.92] max-md:scale-[0.72] scale-[0.88] sm:scale-90 md:scale-[0.97] lg:scale-[1] xl:scale-[1.04]"
          priority={false}
        />
      </div>

      <div className="relative left-1/2 z-[5] mt-0 w-screen max-w-[100vw] -translate-x-1/2 border-t border-black/[0.07] bg-brand-yellowPale px-4 py-3 md:mt-0 md:h-[var(--stages-ribbon-height)] md:px-5 md:py-0 lg:mt-0 lg:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-center font-sans text-[8px] font-bold uppercase leading-tight tracking-[0.14em] text-brand-navy sm:flex-row sm:justify-between sm:gap-4 sm:text-[9px] sm:px-6 md:h-full md:items-center md:px-10 md:text-[10px] lg:px-14">
          {RIBBON.map((line) => (
            <span
              key={line}
              className={cn(
                "min-w-0 flex-1",
                line === "Servicios exclusivos 1:1" && "hidden md:inline",
              )}
            >
              {line}
            </span>
          ))}
        </div>
      </div>

      {modalStage && (
        <StageModal stage={modalStage} onClose={() => setModalStage(null)} />
      )}
    </section>
  );
}
