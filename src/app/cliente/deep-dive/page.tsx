import { buildPageMetadata } from "@/lib/site-metadata";
import { brandUi } from "@/lib/brand-ui";
import { DeepDiveClient } from "./DeepDiveClient";

export const metadata = buildPageMetadata({
  title: "Deep Dive — Soulful Branding®",
  description: "Confirmación de sesión Deep Dive — Soulful Branding®.",
  path: "/cliente/deep-dive",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClienteDeepDivePage({ searchParams }: PageProps) {
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
  return <DeepDiveClient token={token.trim()} />;
}
