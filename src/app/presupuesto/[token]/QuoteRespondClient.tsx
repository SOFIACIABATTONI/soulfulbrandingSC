"use client";

import { useEffect, useState } from "react";
import { CLIENT_RESPONSE_LABELS } from "@/lib/quote-types";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";

type PublicQuote = {
  status: string;
  content: {
    body: string;
    format?: "markdown" | "plain" | "bbb-deck-2026";
    videoUrl?: string;
    total?: number;
    currency?: string;
  };
  clientName: string;
  expiresAt: string;
  respondedAt: string | null;
  clientResponse: string | null;
  canRespond: boolean;
};

export function QuoteRespondClient({ token }: { token: string }) {
  const [data, setData] = useState<PublicQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/quote/${encodeURIComponent(token)}`);
      if (!res.ok) {
        setError("Este enlace no es válido o expiró.");
        setLoading(false);
        return;
      }
      const j = (await res.json()) as { quote: PublicQuote };
      setData(j.quote);
      if (j.quote.clientResponse) setDone(true);
      setLoading(false);
    })();
  }, [token]);

  async function respond(response: "aprobado" | "rechazado" | "consultar") {
    setSubmitting(response);
    setError(null);
    const res = await fetch(
      `/api/public/quote/${encodeURIComponent(token)}/respond`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, comment: comment.trim() }),
      },
    );
    setSubmitting(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo registrar tu respuesta.");
      return;
    }
    setDone(true);
    setData((prev) =>
      prev
        ? {
            ...prev,
            status: response,
            clientResponse: response,
            canRespond: false,
          }
        : prev,
    );
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

  if (error && !data) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">{error}</p>
      </PortalShell>
    );
  }

  if (!data) return null;

  const isDeck = data.content.format === "bbb-deck-2026";

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      subtitle={`Hola, ${data.clientName}`}
      footer={
        <p className="text-[10px] text-center mt-10" style={{ color: brandUi.textFaint }}>
          Válido hasta{" "}
          {new Date(data.expiresAt).toLocaleDateString("es-AR", { dateStyle: "long" })}
        </p>
      }
    >
      <div className={isDeck ? "max-w-3xl mx-auto" : undefined}>
        {isDeck && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-center mb-4" style={{ color: brandUi.textFaint }}>
            Born & Be · Brand ID
          </p>
        )}

        <PortalCard className={isDeck ? "border-0 shadow-none p-0 bg-transparent" : "mb-8"}>
          <QuoteFormattedBody
            body={data.content.body}
            format={data.content.format}
            videoUrl={data.content.videoUrl}
            total={data.content.total}
            currency={data.content.currency}
            theme="light"
          />
        </PortalCard>

        {done || !data.canRespond ? (
          <div
            className="rounded-lg border p-4 text-sm text-center mt-8 bg-white"
            style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
          >
            {data.clientResponse
              ? `Registramos tu respuesta: ${CLIENT_RESPONSE_LABELS[data.clientResponse] ?? data.clientResponse}. Gracias.`
              : data.status === "expirado"
                ? "Este enlace expiró. Escribinos si querés continuar."
                : "Este enlace ya fue cerrado."}
          </div>
        ) : (
          <div className="mt-10">
            <p
              className="text-xs mb-4 text-center uppercase tracking-widest"
              style={{ color: brandUi.textFaint }}
            >
              ¿Cómo querés continuar?
            </p>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4 resize-y bg-white text-brand-navy"
              style={{ borderColor: brandUi.borderStrong }}
              placeholder="Comentario opcional…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => void respond("aprobado")}
                className="w-full rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50 bg-brand-magenta"
              >
                {submitting === "aprobado" ? "Enviando…" : "Aprobar y continuar"}
              </button>
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => void respond("consultar")}
                className="w-full rounded-lg py-3 text-sm font-medium border disabled:opacity-50 border-brand-blue text-brand-blue bg-white"
              >
                {submitting === "consultar" ? "Enviando…" : "Quiero consultar cambios"}
              </button>
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => void respond("rechazado")}
                className="w-full rounded-lg py-2 text-xs disabled:opacity-50"
                style={{ color: brandUi.textFaint }}
              >
                {submitting === "rechazado" ? "Enviando…" : "No continuar por ahora"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center mt-4 text-brand-magenta">{error}</p>
        )}
      </div>
    </PortalShell>
  );
}
