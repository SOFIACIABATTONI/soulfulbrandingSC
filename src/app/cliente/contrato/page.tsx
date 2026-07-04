import { buildPageMetadata } from "@/lib/site-metadata";
import { brandUi } from "@/lib/brand-ui";
import { ContractAcceptClient } from "./ContractAcceptClient";

export const metadata = buildPageMetadata({
  title: "Contrato — Soulful Branding®",
  description: "Revisá y aceptá tu contrato de servicios.",
  path: "/cliente/contrato",
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClienteContratoPage({ searchParams }: PageProps) {
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
  return <ContractAcceptClient token={token.trim()} />;
}
