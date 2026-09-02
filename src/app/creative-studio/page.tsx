import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";
import { SiteHeader } from "@/components/site/SiteHeader";
import { HeroSection, HERO_PAPER_TEXTURE_URL } from "@/components/site/HeroSection";
import { EssenceSection } from "@/components/site/EssenceSection";
import { AboutSection } from "@/components/site/AboutSection";
import { StagesSection } from "@/components/site/StagesSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { ContactSection } from "@/components/site/ContactSection";
import { SectionDebugIndicator } from "@/components/dev/SectionDebugIndicator";

export const metadata = buildPageMetadata({
  title:
    "Sofía Ciabattoni | Identidad de Marca y sistemas de comunicación out of the box",
  description:
    "Sofía Ciabattoni | Soulful Branding®. Revelo identidades de marca y sistemas de comunicación. Estrategia y diseño emocional para proyectos con propósito.",
  openGraphTitle: "Sofía Ciabattoni | Estudio creativo, Método Soulful Branding®",
  openGraphDescription:
    "Soulful Branding®: la fusión de estrategia, identidad y energía para marcas conscientes. Revelo la esencia activando autenticidad y magnetismo.",
  path: "/creative-studio",
});

function firstQueryParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = typeof s === "string" ? s.trim() : "";
  return t || undefined;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreativeStudioPage({ searchParams }: PageProps) {
  const c = await getSiteContent();
  const sp = await searchParams;
  const initialQuery = {
    etapa: firstQueryParam(sp.etapa),
    formulario: firstQueryParam(sp.formulario),
    servicio: firstQueryParam(sp.servicio),
  };

  return (
    <>
      <link rel="preload" as="image" href={HERO_PAPER_TEXTURE_URL} />
      <SiteHeader nav={c.nav} siteBasePath="/creative-studio" />
      <main>
        <HeroSection hero={c.hero} />
        <EssenceSection essence={c.essence} />
        <AboutSection about={c.about} />
        <StagesSection stages={c.stages} />
        <ServicesSection services={c.services} />
        <ContactSection
          contact={c.contact}
          stageOptions={c.stages.stages.map((s) => s.title)}
          stages={c.stages.stages}
          initialQuery={initialQuery}
        />
      </main>
      <SectionDebugIndicator />
    </>
  );
}
