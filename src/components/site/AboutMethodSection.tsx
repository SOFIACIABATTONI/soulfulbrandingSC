import Image from "next/image";
import type { SiteContentData } from "@/lib/site-content";
import { HERO_PAPER_TEXTURE_URL } from "@/components/site/HeroSection";
import { cn } from "@/lib/cn";

const textBase = "text-[0.9375rem] font-normal leading-[1.65] text-black md:text-base md:leading-[1.7]";
type Props = { method: SiteContentData["method"] };
export function AboutMethodSection({ method }: Props) {
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

      <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        {/* Bloque intro: móvil título+só+imagen; desktop dos columnas */}
        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] md:text-xs">{method.tagLabel}</p>
                <h2 id="metodo-heading" className="mt-1 text-lg font-bold tracking-tight md:text-xl">
                  {method.title}
                </h2>
                <p className="mt-2 text-sm font-bold tracking-tight lg:hidden" aria-hidden>
                  SÓ
                </p>
              </div>
              <div className="relative w-[38%] max-w-[200px] shrink-0 lg:hidden">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm">
                  <Image
                    src={method.imageTopUrl}
                    alt=""
                    fill
                    className="object-cover object-[center_25%]"
                    sizes="200px"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            <div className={cn("mt-6 space-y-5 lg:mt-8", textBase)}>
              <p>
                {method.introParagraph1}
              </p>
              <p className="text-base font-bold md:text-[1.05rem]">{method.introHighlight}</p>
              <p>
                {method.introParagraph2}
              </p>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <p className="absolute right-0 top-0 z-10 text-sm font-bold tracking-tight" aria-hidden>
              SÓ
            </p>
            <div className="relative mt-8 aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-sm lg:ml-auto">
              <Image
                src={method.imageTopUrl}
                alt=""
                fill
                className="object-cover object-[center_25%]"
                sizes="360px"
                unoptimized
              />
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
        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(200px,280px)] lg:items-start lg:gap-14">
          <div className={cn("min-w-0 space-y-5", textBase)}>
            <p className="font-medium">{method.transitionsIntro}</p>
            <ul className="space-y-3.5 [list-style:none]">
              {method.transitions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[260px] lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm">
              <Image
                src={method.imageBottomUrl}
                alt=""
                fill
                className="object-cover object-[center_25%]"
                sizes="(max-width: 1024px) 260px, 280px"
                unoptimized
              />
            </div>
          </div>
        </div>

        <p
          className="pointer-events-none relative mt-12 select-none text-right text-[clamp(2.5rem,14vw,7rem)] font-bold leading-none tracking-tight text-neutral-300/50 md:mt-16 lg:mt-20"
          aria-hidden
        >
          {method.watermarkText}
        </p>
      </div>
    </section>
  );
}
