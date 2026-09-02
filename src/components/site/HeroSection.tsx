import type { SiteContentData } from "@/lib/site-content";
import { SectionImage } from "@/components/site/SectionImage";
import { SectionShell } from "@/components/site/SectionShell";

/** Textura de fondo del mockup (copiada a `public/media/`). No cambiar el nombre sin actualizar aquí. */
export const HERO_PAPER_TEXTURE_URL = "/media/paper-texture-site.png" as const;

/** Wordmark oficial (también en `assets/brand/Identidad SVG/`). */
const SOULFUL_BRAND_WORDMARK_SRC = "/brand/soulful-branding.svg" as const;

type Props = { hero: SiteContentData["hero"] };

export function HeroSection({ hero }: Props) {
  const kicker = "SOULFUL BRANDING® EXPERIENCE";
  const heading = "Cuando una marca entiende quién es y qué representa, su identidad se vuelve magnética.";
  /** Mobile mockup: máx. 3 líneas arriba de la foto; el resto debajo de la foto */
  const headingMobileLineClass =
    "mx-auto max-w-[min(92vw,22rem)] px-4 text-center font-sans text-[clamp(1.28rem,5.2vw,1.9rem)] font-bold leading-[1.22] tracking-[-0.01em] text-black";
  const lineOne = "Mi trabajo consiste en acompañar ese proceso.";

  /** Wordmark levemente más grande y con rebalse lateral controlado. */
  const wordmarkClass =
    "box-border min-w-0 w-[108%] max-w-none h-auto max-h-[82%] object-contain object-center sm:w-[110%] sm:max-h-[86%] md:w-[114%] md:max-h-[90%] lg:w-[116%] lg:max-h-[92%] " +
    "brightness-0 invert opacity-[0.42] md:brightness-100 md:invert-0 md:opacity-100";

  return (
    <section id="hero" className="relative overflow-x-hidden bg-brand-page">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: `url('${HERO_PAPER_TEXTURE_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-brand-sky/8" aria-hidden />

      <SectionShell className="relative z-10 py-8 md:py-10 lg:py-12">
        <p className="hidden text-center text-[10px] font-bold uppercase tracking-[0.16em] text-black/35 md:block md:text-[11px] md:tracking-[0.2em]">
          {kicker}
        </p>

        <h1 className="sr-only">{heading}</h1>

        <div aria-hidden className={`relative z-20 mt-4 md:hidden ${headingMobileLineClass}`}>
          <p>
            Cuando una marca
            <br />
            entiende <strong className="font-bold">quién es y qué representa</strong>
            <br />
            &nbsp;
          </p>
        </div>

        <div
          aria-hidden
          className="relative z-20 mx-auto mt-6 hidden max-w-[min(94vw,68rem)] text-center font-sans text-[clamp(1.35rem,2.05vw,2.1rem)] font-bold leading-[1.15] tracking-[-0.01em] text-black md:block"
        >
          <p>
            <span className="block whitespace-nowrap">
              Cuando una marca entiende <strong className="font-extrabold">quién es y qué representa</strong>,
            </span>
            <span className="block whitespace-nowrap">su identidad se vuelve magnética.</span>
          </p>
        </div>

        {/* Bloque cielo + wordmark (ancho completo del sky) + modelo delante */}
        <div className="relative z-0 mx-auto mt-8 w-full max-w-[1120px] pb-24 sm:pb-28 md:mt-14 md:pb-0">
          <div className="relative z-10 mx-auto w-full max-w-[980px] bg-brand-sky/95">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/sky-band.png"
              alt=""
              className="block h-[180px] w-full object-cover sm:h-[220px] md:h-[250px] lg:h-[270px]"
            />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 text-center md:hidden">
              <p className="font-sans text-[clamp(2.35rem,15.5vw,3.3rem)] font-bold leading-[0.9] tracking-[-0.02em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.18)]">
                Soulful
                <br />
                Branding®
              </p>
            </div>
            <div className="pointer-events-none absolute -inset-x-5 inset-y-0 z-20 hidden items-center justify-center sm:-inset-x-7 md:flex md:-inset-x-10 lg:-inset-x-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SOULFUL_BRAND_WORDMARK_SRC} alt="" className={wordmarkClass} />
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[42%] z-30 w-[48%] max-w-[260px] -translate-x-1/2 -translate-y-1/2 sm:top-[47%] sm:w-[50%] md:top-[50%] md:w-[21%] md:max-w-[235px] lg:top-[48%] lg:w-[23%] lg:max-w-[260px]">
            <SectionImage
              src={hero.imageUrl}
              alt=""
              className="relative aspect-[2/3] w-full overflow-hidden"
              imgClassName="object-cover object-[50%_18%] max-md:[clip-path:inset(0_0_6%_0)] sm:object-[50%_22%] md:object-[50%_30%] md:[clip-path:none]"
              priority
            />
          </div>
        </div>

        <div aria-hidden className={`relative z-40 mt-4 md:hidden ${headingMobileLineClass}`}>
          <p>
            su <strong className="font-bold">Identidad</strong>
            <br />
            se vuelve <strong className="font-bold">magnética</strong>.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-[42rem] text-center md:mt-20">
          <p className="font-sans text-[clamp(0.95rem,1.45vw,1.3rem)] font-normal leading-[1.3] text-black md:text-[clamp(0.95rem,1.1vw,1.15rem)]">
            {lineOne}
          </p>
          <p className="mt-1 font-sans text-[clamp(1rem,1.6vw,1.45rem)] font-normal leading-[1.25] text-black md:text-[clamp(1rem,1.2vw,1.2rem)]">
            That’s <strong className="font-bold">WHY</strong> Soulful Branding®.
          </p>
        </div>
      </SectionShell>
    </section>
  );
}
