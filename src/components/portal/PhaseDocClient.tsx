"use client";

import { useEffect, useState } from "react";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";
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

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title={data.portalTitle}
      subtitle={`${data.clientName} · ${data.projectTitle}`}
    >
      <PortalCard className="max-w-3xl mx-auto mb-8">
        <div
          className="phase-doc-html prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: data.htmlBody }}
        />
      </PortalCard>

      {done ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">{data.ackSuccessTitle}</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            {data.ackSuccessBody}
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
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
