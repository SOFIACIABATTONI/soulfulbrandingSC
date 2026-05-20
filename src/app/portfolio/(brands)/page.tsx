import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";
import { PORTFOLIO_SHOWCASE } from "@/lib/portfolio-showcase";
import { getTestimonials } from "@/lib/testimonials";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PortfolioShowcase } from "@/components/site/PortfolioShowcase";
import { PortfolioTestimonialsCarousel } from "@/components/site/PortfolioTestimonialsCarousel";

export const metadata = buildPageMetadata({
  title: "Portfolio | Soulful Branding®",
  description:
    "Portfolio de identidades de marca y proyectos de branding estratégico. Casos de estudio Soulful Branding®.",
  path: "/portfolio",
});

export default async function PortfolioPage() {
  const c = await getSiteContent();
  const testimonials = await getTestimonials();

  return (
    <>
      <SiteHeader nav={c.nav} />
      <main className="min-h-screen flex-1 bg-brand-page pb-20 pt-10 md:pb-12 md:pt-3">
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4">
          <Link
            href="/"
            className="mb-6 inline-block text-[11px] font-bold uppercase tracking-[0.32em] text-brand-navy/80 transition hover:opacity-70 md:mb-2"
          >
            ← Volver
          </Link>
          <h1 className="font-serif text-4xl font-medium leading-tight text-brand-navy md:text-4xl lg:text-5xl">Brand&apos;s</h1>
          <PortfolioShowcase items={PORTFOLIO_SHOWCASE} />
          <div className="mt-8 hidden border-t border-brand-navy/10 pt-8 md:block">
            <PortfolioTestimonialsCarousel items={testimonials} />
          </div>
        </div>
      </main>
    </>
  );
}
