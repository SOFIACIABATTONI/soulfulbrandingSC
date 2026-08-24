"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";

type DeepDivePayload = {
  clientName: string;
  projectTitle: string;
  scheduled: boolean;
};

export function DeepDiveClient({ token }: { token: string }) {
  const [data, setData] = useState<DeepDivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/deep-dive/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Este enlace no es válido o expiró.");
        setLoading(false);
        return;
      }
      const j = (await res.json()) as DeepDivePayload;
      setData(j);
      setDone(j.scheduled);
      setLoading(false);
    })();
  }, [token]);

  async function confirmScheduled() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/deep-dive/${encodeURIComponent(token)}`, {
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
          Cargando…
        </p>
      </PortalShell>
    );
  }

  if (!data) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">{error ?? "Enlace no válido."}</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Sesión Deep Dive"
      subtitle={`${data.clientName} · ${data.projectTitle}`}
    >
      {done ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-4 text-brand-magenta">✓</div>
          <p className="font-serif text-xl italic mb-2 text-brand-navy">Llamada confirmada</p>
          <p className="text-sm" style={{ color: brandUi.textMuted }}>
            Gracias, {data.clientName.split(" ")[0]}. Sofía recibió la notificación.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4 max-w-md mx-auto">
          <p className="text-sm leading-relaxed" style={{ color: brandUi.textMuted }}>
            Si ya reservaste tu horario en el calendario, confirmalo acá para que Sofía lo vea en
            el ERP.
          </p>
          {error && <p className="text-sm text-brand-magenta">{error}</p>}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void confirmScheduled()}
            className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider text-white bg-brand-magenta disabled:opacity-50"
          >
            {submitting ? "Procesando…" : "Ya agendé mi llamada"}
          </button>
        </div>
      )}
    </PortalShell>
  );
}
