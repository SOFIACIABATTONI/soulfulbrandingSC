"use client";

import { useEffect, useState } from "react";
import { CLIENT_RESPONSE_LABELS } from "@/lib/quote-types";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";

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
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#0D0D0D" }}
      >
        <p className="text-sm" style={{ color: "rgba(249,243,219,0.5)" }}>
          Cargando…
        </p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#0D0D0D" }}
      >
        <p className="text-sm text-center max-w-md" style={{ color: "#F03172" }}>
          {error}
        </p>
      </main>
    );
  }

  if (!data) return null;

  const isDeck = data.content.format === "bbb-deck-2026";

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: "#0D0D0D" }}>
      <article className={isDeck ? "max-w-3xl mx-auto" : "max-w-xl mx-auto"}>
        <header className="mb-8 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.25em] mb-3"
            style={{ color: "#F03172" }}
          >
            Soulful Branding®
          </p>
          <p className="text-sm" style={{ color: "rgba(249,243,219,0.55)" }}>
            Hola, {data.clientName}
          </p>
          {isDeck && (
            <p
              className="text-[10px] uppercase tracking-[0.2em] mt-2"
              style={{ color: "rgba(249,243,219,0.35)" }}
            >
              Born & Be · Brand ID
            </p>
          )}
        </header>

        <div
          className={isDeck ? "rounded-lg overflow-hidden" : "rounded-lg border px-6 py-8 sm:px-8"}
          style={
            isDeck
              ? { background: "#0D0D0D" }
              : {
                  borderColor: "rgba(249,243,219,0.12)",
                  background: "rgba(13,13,13,0.6)",
                }
          }
        >
          <QuoteFormattedBody
            body={data.content.body}
            format={data.content.format}
            videoUrl={data.content.videoUrl}
            total={data.content.total}
            currency={data.content.currency}
          />
        </div>

        {done || !data.canRespond ? (
          <div
            className="rounded p-4 text-sm text-center mt-8"
            style={{
              background: "rgba(249,243,219,0.06)",
              color: "rgba(249,243,219,0.85)",
              border: "1px solid rgba(249,243,219,0.1)",
            }}
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
              style={{ color: "rgba(249,243,219,0.45)" }}
            >
              ¿Cómo querés continuar?
            </p>
            <textarea
              className="w-full rounded border px-3 py-2 text-sm mb-4 resize-y"
              style={{
                borderColor: "rgba(249,243,219,0.2)",
                background: "rgba(249,243,219,0.06)",
                color: "#F9F3DB",
              }}
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
                className="w-full rounded py-3 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "#F03172" }}
              >
                {submitting === "aprobado" ? "Enviando…" : "Aprobar y continuar"}
              </button>
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => void respond("consultar")}
                className="w-full rounded py-3 text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: "#323FF6", color: "#323FF6" }}
              >
                {submitting === "consultar" ? "Enviando…" : "Quiero consultar cambios"}
              </button>
              <button
                type="button"
                disabled={!!submitting}
                onClick={() => void respond("rechazado")}
                className="w-full rounded py-2 text-xs disabled:opacity-50"
                style={{ color: "rgba(249,243,219,0.4)" }}
              >
                {submitting === "rechazado" ? "Enviando…" : "No continuar por ahora"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center mt-4" style={{ color: "#F03172" }}>
            {error}
          </p>
        )}

        <p
          className="text-[10px] text-center mt-10"
          style={{ color: "rgba(249,243,219,0.3)" }}
        >
          Válido hasta{" "}
          {new Date(data.expiresAt).toLocaleDateString("es-AR", { dateStyle: "long" })}
        </p>
      </article>
    </main>
  );
}
