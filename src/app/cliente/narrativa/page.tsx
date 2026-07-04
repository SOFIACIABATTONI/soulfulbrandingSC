import { buildPageMetadata } from "@/lib/site-metadata";
import { brandUi } from "@/lib/brand-ui";
import { NarrativaClient } from "./NarrativaClient";

export const metadata = buildPageMetadata({
  title: "Narrativa de marca — Soulful Branding®",
  description: "Estrategia verbal y narrativa de tu marca — Soulful Branding®.",
  path: "/cliente/narrativa",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClienteNarrativaPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-brand-page">
        <p className="text-sm text-center" style={{ color: brandUi.textMuted }}>
          Falta el enlace de acceso. Revisá el mail que te enviamos o contactá a Sofía.
        </p>
      </main>
    );
  }
  return <NarrativaClient token={token.trim()} />;
}
