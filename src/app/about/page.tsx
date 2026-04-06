import { getSiteContent } from "@/lib/content";
import { SiteHeader } from "@/components/site/SiteHeader";
import { AboutMorePage } from "@/components/site/AboutMorePage";

export const metadata = {
  title: "MORE ABOUT | Soulful Branding®",
};

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
