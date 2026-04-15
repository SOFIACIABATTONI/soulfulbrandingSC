import Image from "next/image";
import type { SiteContentData } from "@/lib/site-content";
import { HERO_PAPER_TEXTURE_URL } from "@/components/site/HeroSection";
import { cn } from "@/lib/cn";
import methodPortraitHiRes from "../../../assets/images/shared/cancansentada.png";

const textBase = "text-[0.9375rem] font-normal leading-[1.65] text-black md:text-base md:leading-[1.7]";

function splitMethodWatermark(text: string): { first: string; second: string } {
  const idx = text.indexOf(" Branding");
  if (idx === -1) return { first: text, second: "" };
  return { first: text.slice(0, idx).trim(), second: text.slice(idx + 1).trim() };
}

type Props = { method: SiteContentData["method"] };
export function AboutMethodSection({ method }: Props) {
  const wm = splitMethodWatermark(method.watermarkText);
  return (
    <section
      id="metodo"
      className="relative overflow-hidden border-t border-black/10 bg-[#F9F9F9] text-black"
      aria-labelledby="metodo-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `url('${HERO_PAPER_TEXTURE_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">

        {/* Bloque intro: texto izquierda + imagen de fondo derecha (desktop) */}
        <div className="relative mt-4 lg:mt-1">

          {/* Imagen desktop: absoluta a la derecha, ocupa toda la altura del bloque */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-[48%] lg:block"
            aria-hidden
          >
            <p className="absolute right-0 top-0 z-10 text-sm font-bold tracking-tight">SÓ</p>
            <div className="relative h-full w-full">
              <Image
                src={methodPortraitHiRes}
                alt=""
                fill
                className="object-contain object-bottom"
                sizes="48vw"
                priority
              />
            </div>
          </div>

          {/* Texto: izquierda con margen derecho para dejar espacio a la imagen */}
          <div className="min-w-0 lg:w-[50%]">
            <div className="flex gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] md:text-xs">{method.tagLabel}</p>
                <h2 id="metodo-heading" className="mt-1 text-lg font-bold tracking-tight md:text-xl">
                  {method.title}
                </h2>
              </div>
              {/* Imagen mobile: solo visible en móvil */}
              <div className="relative w-[34%] max-w-[150px] shrink-0 lg:hidden">
                <div className="relative aspect-[2693/4474] w-full overflow-hidden">
                  <Image
                    src={methodPortraitHiRes}
                    alt=""
                    fill
                    className="object-contain object-bottom"
                    sizes="150px"
                  />
                </div>
              </div>
            </div>

            <div className={cn("mt-6 space-y-5 pb-10 lg:mt-8 lg:pb-20", textBase)}>
              <p>{method.introParagraph1}</p>
              <p className="text-base font-bold md:text-[1.05rem]">{method.introHighlight}</p>
              <p>{method.introParagraph2}</p>
            </div>
          </div>
        </div>

        {/* Pilares */}
        <div className="mt-14 lg:mt-20">
          <div className="inline-block max-w-full bg-[#4248B5] px-4 py-2.5 text-[13px] font-medium leading-snug text-white shadow-sm sm:px-5 sm:text-sm md:text-[0.95rem]">
            {method.pillarsIntro}
          </div>
          <ol className="mt-6 list-decimal space-y-0 border-t border-black/15 pl-5 marker:font-semibold">
            {method.pillars.map((label) => (
              <li
                key={label}
                className="border-b border-black/15 py-3.5 pl-2 text-[0.95rem] font-semibold tracking-tight md:text-base"
              >
                {label}
              </li>
            ))}
          </ol>
        </div>

        {/* Transiciones + imagen */}
        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] lg:items-start lg:gap-14">
          <div className={cn("min-w-0 space-y-5", textBase)}>
            <p className="font-medium">{method.transitionsIntro}</p>
            <ul className="space-y-3.5 [list-style:none]">
              {method.transitions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] overflow-visible lg:mx-0 lg:max-w-none">
            <div
              className="pointer-events-none absolute inset-x-1/2 top-[72%] z-0 w-[115%] -translate-x-1/2 -translate-y-1/2 text-center lg:hidden"
              aria-hidden
            >
              <span className="block text-[clamp(2.8rem,16vw,5rem)] font-bold leading-[0.88] tracking-tight text-neutral-300/45">
                {wm.first}
              </span>
              {wm.second ? (
                <span className="block text-[clamp(2.8rem,16vw,5rem)] font-bold leading-[0.88] tracking-tight text-neutral-300/45">
                  {wm.second}
                </span>
              ) : null}
            </div>
            <div className="relative z-10 aspect-square w-full overflow-hidden">
              <Image
                src={method.imageBottomUrl}
                alt=""
                fill
                className="object-contain object-center"
                sizes="(max-width: 1024px) 280px, 320px"
                unoptimized
              />
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none relative mt-12 hidden select-none text-center text-[clamp(2.5rem,14vw,7rem)] font-bold leading-none tracking-tight text-neutral-300/50 md:mt-16 md:block lg:mt-20"
          aria-hidden
        >
          <span className="block">{wm.first}</span>
          {wm.second ? <span className="block">{wm.second}</span> : null}
        </div>
      </div>
    </section>
  );
}
