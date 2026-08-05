"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { resolveContractHtml } from "@/lib/contract-html-templates";
import { brandUi } from "@/lib/brand-ui";
import type { ContractContent } from "@/lib/contract-types";
import { validateTypedName } from "@/lib/contract-acceptance";
import "@/components/admin/rich-text-editor.css";

type PublicContract = {
  clientName: string;
  projectTitle: string;
  service: string;
  value: number;
  content: ContractContent;
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
  const [typedName, setTypedName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

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
      setTypedName(j.clientName);
      if (j.error) setError(j.error);
      if (j.usedAt || j.contractStatus === "aceptado") setDone(true);
      setLoading(false);
    })();
  }, [token]);

  const nameError = useMemo(() => {
    if (!data || done) return null;
    if (!typedName.trim()) return null;
    return validateTypedName(typedName, data.clientName);
  }, [data, done, typedName]);

  const canSubmit =
    Boolean(data?.canAccept) &&
    termsAccepted &&
    typedName.trim().length > 0 &&
    !nameError &&
    !submitting;

  async function accept() {
    if (!data || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(
      `/api/public/access/${encodeURIComponent(token)}/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typedName: typedName.trim(),
          termsAccepted: true,
        }),
      },
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

  const contractHtml = resolveContractHtml(data.content);

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Contrato de servicios"
      subtitle={`${data.projectTitle} · EUR ${data.value.toLocaleString("en-US")}`}
    >
      <PortalCard className="mb-8">
        <div
          className="phase-doc-html max-w-none"
          dangerouslySetInnerHTML={{ __html: contractHtml }}
        />
      </PortalCard>

      {done ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">Contrato aceptado</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            Gracias, {data.clientName.split(" ")[0]}. Sofía recibirá la confirmación y te
            enviaremos un PDF con el registro de aceptación.
          </p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">
          {error && <p className="text-sm text-brand-magenta text-center">{error}</p>}
          {data.canAccept && (
            <>
              <label className="block">
                <span
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: brandUi.textFaint }}
                >
                  Nombre completo
                </span>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                  placeholder={data.clientName}
                  autoComplete="name"
                />
                {nameError && (
                  <p className="text-xs mt-1 text-brand-magenta">{nameError}</p>
                )}
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-brand-magenta"
                />
                <span className="text-sm leading-relaxed" style={{ color: brandUi.textMuted }}>
                  Confirmo que leí y acepto los términos de este contrato. Entiendo que esta
                  aceptación electrónica tiene validez como manifestación de consentimiento.
                </span>
              </label>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void accept()}
                  className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider text-white bg-brand-magenta disabled:opacity-50"
                >
                  {submitting ? "Procesando…" : "Aceptar contrato"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </PortalShell>
  );
}
