import { buildPageMetadata } from "@/lib/site-metadata";
import { brandUi } from "@/lib/brand-ui";
import { PhaseDocClient } from "@/components/portal/PhaseDocClient";

export const metadata = buildPageMetadata({
  title: "Entrega — Soulful Branding®",
  description: "Revisá y confirmá la recepción de tu documento.",
  path: "/cliente/fase",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClienteFasePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token?.trim()) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-brand-page">
        <p className="text-sm text-center" style={{ color: brandUi.textMuted }}>
          Falta el enlace de acceso. Revisá el mail que te enviamos.
        </p>
      </main>
    );
  }
  return <PhaseDocClient token={token.trim()} />;
}
