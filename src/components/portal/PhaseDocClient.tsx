"use client";

import { useEffect, useState } from "react";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { BrandKitClientView } from "@/components/portal/BrandKitClientView";
import { brandUi } from "@/lib/brand-ui";
import type { BrandKit } from "@/lib/brand-kit";
import "@/components/admin/rich-text-editor.css";

type PhaseDocPayload = {
  clientName: string;
  projectTitle: string;
  portalTitle: string;
  htmlBody: string;
  canAcknowledge: boolean;
  done: boolean;
  ackButton: string;
  ackSuccessTitle: string;
  ackSuccessBody: string;
  permanentLink?: boolean;
  canDownload?: boolean;
  downloadUrl?: string;
  brandKitZipUrl?: string | null;
  brandKit?: BrandKit;
  hasBrandKit?: boolean;
  hasManualPdf?: boolean;
  manualPdf?: { fileName: string; downloadUrl: string | null } | null;
};

export function PhaseDocClient({ token }: { token: string }) {
  const [data, setData] = useState<PhaseDocPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/phase-doc/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Este enlace no es válido o expiró.");
        setLoading(false);
        return;
      }
      const j = (await res.json()) as PhaseDocPayload;
      setData(j);
      setDone(j.done);
      setLoading(false);
    })();
  }, [token]);

  async function acknowledge() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/phase-doc/${encodeURIComponent(token)}`, {
      method: "POST",
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo registrar la confirmación.");
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <PortalShell>
        <p className="text-center text-sm" style={{ color: brandUi.textMuted }}>
          Cargando documento…
        </p>
      </PortalShell>
    );
  }

  if (!data) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">{error ?? "Error al cargar."}</p>
      </PortalShell>
    );
  }

  const manualPdfUrl = data.manualPdf?.downloadUrl;
  const showIdentidadZipHint = data.hasBrandKit && data.brandKitZipUrl && !data.hasManualPdf;

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title={data.portalTitle}
      subtitle={`${data.clientName} · ${data.projectTitle}`}
    >
      {data.hasManualPdf && manualPdfUrl && (
        <div className="max-w-3xl mx-auto mb-6 print:hidden">
          <div
            className="rounded-2xl border px-5 py-6 text-center space-y-4"
            style={{ borderColor: brandUi.border, background: "rgba(240,49,114,0.04)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: brandUi.text }}>
                Tu manual de marca
              </p>
              <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
                {data.manualPdf?.fileName ?? "manual-de-marca.pdf"}
              </p>
              {data.permanentLink && (
                <p className="text-xs mt-2" style={{ color: brandUi.textFaint }}>
                  Guardá este enlace: no vence y podés volver a descargar tu manual cuando quieras.
                </p>
              )}
            </div>
            <a
              href={manualPdfUrl}
              download={data.manualPdf?.fileName || "manual-de-marca.pdf"}
              className="inline-block rounded-full px-8 py-3 text-sm font-medium text-white"
              style={{ background: brandUi.accent }}
            >
              Descargar manual PDF
            </a>
          </div>
        </div>
      )}

      {data.hasBrandKit && data.brandKit && (
        <BrandKitClientView brandKit={data.brandKit} zipDownloadUrl={data.brandKitZipUrl} />
      )}

      {data.htmlBody.trim() && (
      <PortalCard className="max-w-3xl mx-auto mb-8">
        <div
          className="phase-doc-html max-w-none"
          dangerouslySetInnerHTML={{ __html: data.htmlBody }}
        />
      </PortalCard>
      )}

      {done ? (
        <div className="text-center py-6 print:hidden">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">{data.ackSuccessTitle}</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            {data.ackSuccessBody}
          </p>
          {data.permanentLink && data.hasManualPdf && (
            <p className="text-xs mt-4" style={{ color: brandUi.textFaint }}>
              Podés volver a este enlace cuando quieras para descargar tu manual.
            </p>
          )}
          {data.permanentLink && showIdentidadZipHint && (
            <p className="text-xs mt-4" style={{ color: brandUi.textFaint }}>
              Podés volver a este enlace cuando quieras para descargar tu identidad en ZIP.
            </p>
          )}
        </div>
      ) : (
        <div className="text-center space-y-4 print:hidden">
          {error && <p className="text-sm text-brand-magenta">{error}</p>}
          {data.canAcknowledge && (
            <>
              <p className="text-xs uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                Al confirmar, Sofía recibirá aviso de que recibiste este documento.
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void acknowledge()}
                className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider text-white bg-brand-magenta disabled:opacity-50"
              >
                {submitting ? "Procesando…" : data.ackButton}
              </button>
            </>
          )}
        </div>
      )}
    </PortalShell>
  );
}
