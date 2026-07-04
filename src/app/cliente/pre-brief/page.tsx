import { buildPageMetadata } from "@/lib/site-metadata";
import { brandUi } from "@/lib/brand-ui";
import { PrebriefClient } from "./PrebriefClient";

export const metadata = buildPageMetadata({
  title: "Pre-brief — Soulful Branding®",
  description: "Exploración de la esencia de tu marca — Soulful Branding®.",
  path: "/cliente/pre-brief",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClientePrebriefPage({ searchParams }: PageProps) {
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
  return <PrebriefClient token={token.trim()} />;
}
