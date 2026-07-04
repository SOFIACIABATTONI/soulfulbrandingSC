"use client";

import { useEffect, useState } from "react";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";

type PublicContract = {
  clientName: string;
  projectTitle: string;
  service: string;
  value: number;
  content: { body: string; format?: string };
  contractStatus: string;
  canAccept: boolean;
  error: string | null;
  usedAt: string | null;
};

export function ContractAcceptClient({ token }: { token: string }) {
  const [data, setData] = useState<PublicContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/access/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setError("Este enlace no es válido o expiró.");
        setLoading(false);
        return;
      }
      const j = (await res.json()) as PublicContract;
      setData(j);
      if (j.error) setError(j.error);
      if (j.usedAt || j.contractStatus === "aceptado") setDone(true);
      setLoading(false);
    })();
  }, [token]);

  async function accept() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(
      `/api/public/access/${encodeURIComponent(token)}/accept`,
      { method: "POST" },
    );
    setSubmitting(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo registrar la aceptación.");
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <PortalShell>
        <p className="text-center text-sm" style={{ color: brandUi.textMuted }}>
          Cargando contrato…
        </p>
      </PortalShell>
    );
  }

  if (!data && error) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">{error}</p>
      </PortalShell>
    );
  }

  if (!data) return null;

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Contrato de servicios"
      subtitle={`${data.projectTitle} · USD ${data.value.toLocaleString("en-US")}`}
    >
      <PortalCard className="mb-8">
        <QuoteFormattedBody body={data.content.body} format="markdown" theme="light" />
      </PortalCard>

      {done ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">Contrato aceptado</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            Gracias, {data.clientName.split(" ")[0]}. Sofía recibirá la confirmación y te
            contactará con los próximos pasos.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {error && <p className="text-sm text-brand-magenta">{error}</p>}
          {data.canAccept && (
            <>
              <p className="text-xs uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                Al hacer click confirmás que leíste y aceptás los términos del contrato.
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void accept()}
                className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider text-white bg-brand-magenta disabled:opacity-50"
              >
                {submitting ? "Procesando…" : "Aceptar contrato"}
              </button>
            </>
          )}
        </div>
      )}
    </PortalShell>
  );
}
