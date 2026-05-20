import { LegalMarkdownBody } from "@/components/site/LegalMarkdownBody";
import { LegalDocShell } from "@/components/site/LegalDocShell";
import { readLegalMarkdownFile } from "@/lib/legal-docs";
import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Política de privacidad | Soulful Branding®",
  description: "Política de privacidad del sitio Soulful Branding® — sofiaciabattoni.com.",
  path: "/politica-privacidad",
});

export default async function PoliticaPrivacidadPage() {
  const [c, body] = await Promise.all([getSiteContent(), readLegalMarkdownFile("politica-privacidad.md")]);

  return (
    <LegalDocShell title="Política de privacidad" nav={c.nav}>
      <LegalMarkdownBody content={body} />
      <p className="pt-6 text-xs text-neutral-500">
        Documentos relacionados: <a href="/politica-cookies">Política de cookies</a>,{" "}
        <a href="/aviso-legal">Aviso legal</a>.
      </p>
    </LegalDocShell>
  );
}
