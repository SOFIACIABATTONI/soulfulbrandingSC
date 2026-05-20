import { LegalMarkdownBody } from "@/components/site/LegalMarkdownBody";
import { LegalDocShell } from "@/components/site/LegalDocShell";
import { readLegalMarkdownFile } from "@/lib/legal-docs";
import { getSiteContent } from "@/lib/content";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Política de cookies | Soulful Branding®",
  description: "Política de cookies del sitio Soulful Branding® — sofiaciabattoni.com.",
  path: "/politica-cookies",
});

export default async function PoliticaCookiesPage() {
  const [c, body] = await Promise.all([getSiteContent(), readLegalMarkdownFile("politica-cookies.md")]);

  return (
    <LegalDocShell title="Política de cookies" nav={c.nav}>
      <LegalMarkdownBody content={body} />
      <p className="pt-6 text-xs text-neutral-500">
        Documentos relacionados: <a href="/politica-privacidad">Política de privacidad</a>,{" "}
        <a href="/aviso-legal">Aviso legal</a>.
      </p>
    </LegalDocShell>
  );
}
