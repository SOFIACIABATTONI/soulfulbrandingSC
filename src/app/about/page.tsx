import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AboutMorePage } from "@/components/site/AboutMorePage";

export const metadata = buildPageMetadata({
  title: "MORE ABOUT | Soulful Branding®",
  description:
    "Conocé a Sofía Ciabattoni, fundadora de Soulful Branding®. Artista, alquimista y especialista en branding estratégico y diseño emocional.",
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
