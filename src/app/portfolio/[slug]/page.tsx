import type { StaticImageData } from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import { buildPageMetadata, DEFAULT_OG_IMAGE_PATH } from "@/lib/site-metadata";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SectionImage } from "@/components/site/SectionImage";
import { PortfolioCaseStudy } from "@/components/site/PortfolioCaseStudy";
import { PORTFOLIO_SHOWCASE } from "@/lib/portfolio-showcase";
import { getPortfolioGalleryFiles } from "@/lib/portfolio-gallery";
import { findTestimonialForProjectSlug, getTestimonials } from "@/lib/testimonials";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function portfolioOgImagePath(cover: string | StaticImageData | undefined): string {
  return typeof cover === "string" ? cover : DEFAULT_OG_IMAGE_PATH;
}

export async function generateMetadata(ctx: Pick<PageProps, "params">) {
  const { slug } = await ctx.params;
  const item = PORTFOLIO_SHOWCASE.find((p) => p.id === slug);
  if (item) {
    return buildPageMetadata({
      title: `${item.title} | Caso de branding | Soulful Branding®`,
      description: `Proyecto de identidad de marca: ${item.title}. Portfolio Soulful Branding® — branding estratégico y diseño emocional.`,
      path: `/portfolio/${slug}`,
      imagePath: portfolioOgImagePath(item.cover),
    });
  }

  const project = await prisma.project.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true, imageUrl: true },
  });
  if (project) {
    return buildPageMetadata({
      title: `${project.title} | Soulful Branding®`,
      description:
        project.excerpt?.trim() ||
        `Proyecto de branding: ${project.title}. Portfolio Soulful Branding®.`,
      path: `/portfolio/${slug}`,
      imagePath: project.imageUrl?.trim() || DEFAULT_OG_IMAGE_PATH,
    });
  }

  return buildPageMetadata({
    title: "Proyecto | Soulful Branding®",
    path: `/portfolio/${slug}`,
  });
}

export default async function ProjectDetailPage(ctx: PageProps) {
  const { slug } = await ctx.params;
  const c = await getSiteContent();

  const showcase = PORTFOLIO_SHOWCASE.find((p) => p.id === slug);
  if (showcase) {
    const gallery = getPortfolioGalleryFiles(slug);
    const allTestimonials = await getTestimonials();
    const testimonial = findTestimonialForProjectSlug(slug, allTestimonials);
    return (
      <>
        <SiteHeader nav={c.nav} />
        <main className="min-h-screen bg-brand-page pb-10 pt-10">
          <PortfolioCaseStudy item={showcase} gallery={gallery} testimonial={testimonial} />
        </main>
      </>
    );
  }

  const project = await prisma.project.findFirst({
    where: { slug, published: true },
  });
  if (!project) notFound();

  return (
    <>
      <SiteHeader nav={c.nav} />
      <main className="min-h-screen bg-brand-cream pb-20 pt-10">
        <article className="mx-auto max-w-3xl px-4">
          <Link href="/portfolio" className="text-sm font-medium text-brand-blue hover:underline">
            ← Volver al portfolio
          </Link>
          {project.category && (
            <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-neutral-500">{project.category}</p>
          )}
          <h1 className="mt-2 font-serif text-4xl font-medium text-brand-navy md:text-5xl">{project.title}</h1>
          {project.imageUrl && (
            <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100">
              <SectionImage src={project.imageUrl} alt={project.title} className="absolute inset-0 h-full w-full" priority />
            </div>
          )}
          <div className="prose prose-neutral mt-8 max-w-none">
            {project.description ? (
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-brand-navy/85">{project.description}</p>
            ) : (
              <p className="text-lg text-brand-navy/85">{project.excerpt}</p>
            )}
          </div>
        </article>
      </main>
    </>
  );
}
