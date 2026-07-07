"use client";

import { useEffect, useState } from "react";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";
import "@/components/admin/rich-text-editor.css";

type NarrativaPayload = {
  clientName: string;
  projectTitle: string;
  content: { body: string; format?: string };
  sentAt: string | null;
  canAcknowledge: boolean;
  done: boolean;
};

export function NarrativaClient({ token }: { token: string }) {
  const [data, setData] = useState<NarrativaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25_000);
      try {
        const res = await fetch(`/api/public/narrativa/${encodeURIComponent(token)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Este enlace no es válido o expiró.");
          return;
        }
        const j = (await res.json()) as NarrativaPayload;
        setData(j);
        setDone(j.done);
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        setError(
          aborted
            ? "La carga tardó demasiado. Recargá la página."
            : "No se pudo cargar la narrativa.",
        );
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    })();
  }, [token]);

  async function acknowledge() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/narrativa/${encodeURIComponent(token)}`, {
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
          Cargando narrativa…
        </p>
      </PortalShell>
    );
  }

  if (!data) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">
          {error ?? "No se pudo cargar la narrativa."}
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Narrativa de marca"
      subtitle={`${data.clientName} · ${data.projectTitle}`}
    >
      <PortalCard className="max-w-3xl mx-auto mb-8">
        <div
          className="phase-doc-html max-w-none"
          dangerouslySetInnerHTML={{ __html: data.content.body }}
        />
      </PortalCard>

      {done ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">Narrativa recibida</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            Gracias, {data.clientName.split(" ")[0]}. Sofía recibirá la confirmación.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {error && <p className="text-sm text-brand-magenta">{error}</p>}
          {data.canAcknowledge && (
            <>
              <p className="text-xs uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                Revisá el documento y confirmá que lo recibiste.
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void acknowledge()}
                className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider text-white bg-brand-magenta disabled:opacity-50"
              >
                {submitting ? "Procesando…" : "Confirmar recibido"}
              </button>
            </>
          )}
        </div>
      )}
    </PortalShell>
  );
}
