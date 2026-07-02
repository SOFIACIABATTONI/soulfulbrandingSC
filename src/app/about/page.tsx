import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AboutMorePage } from "@/components/site/AboutMorePage";

export const metadata = buildPageMetadata({
  title: "Sobre Mí | Soulful Branding y atelier identitario.",
  description:
    "Soy Artista y Alquimista de marcas. En mi estudio creativo fusiono estrategia, identidad, energía y sensibilidad emocional para visibilizar marcas con propósito.",
  openGraphTitle: "Sobre Mí | Sofía Ciabattoni, Artista y Alquimista",
  openGraphDescription:
    "Conocé a Sofía Ciabattoni. En mi estudio creativo fusiono estrategia, identidad y diseño para visibilizar marcas con propósito.",
  path: "/about",
});

export default async function AboutPage() {
  const c = await getSiteContent();

  return (
    <>
      <SiteHeader nav={c.nav} />
      <main>
        <AboutMorePage aboutMore={c.aboutMore} method={c.method} />
      </main>
    </>
  );
}
