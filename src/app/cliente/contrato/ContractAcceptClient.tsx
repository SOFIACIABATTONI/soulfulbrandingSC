"use client";

import { useEffect, useState } from "react";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";

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
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#0D0D0D" }}
      >
        <p className="text-sm" style={{ color: "rgba(249,243,219,0.6)" }}>
          Cargando contrato…
        </p>
      </main>
    );
  }

  if (!data && error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#0D0D0D" }}
      >
        <div className="max-w-md text-center">
          <p className="font-serif text-2xl italic mb-3" style={{ color: "#F9F3DB" }}>
            Enlace no disponible
          </p>
          <p className="text-sm" style={{ color: "rgba(249,243,219,0.55)" }}>
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "#0D0D0D" }}>
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <p
            className="text-[10px] uppercase tracking-[0.2em] mb-2"
            style={{ color: "rgba(249,243,219,0.45)" }}
          >
            Soulful Branding®
          </p>
          <h1 className="font-serif text-3xl italic mb-2" style={{ color: "#F9F3DB" }}>
            Contrato de servicios
          </h1>
          <p className="text-sm" style={{ color: "rgba(249,243,219,0.55)" }}>
            {data.projectTitle} · USD {data.value.toLocaleString("en-US")}
          </p>
        </header>

        <div
          className="rounded-lg border p-6 mb-8"
          style={{
            borderColor: "rgba(249,243,219,0.12)",
            background: "rgba(249,243,219,0.04)",
          }}
        >
          <QuoteFormattedBody body={data.content.body} format="markdown" />
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">✓</div>
            <p className="font-serif text-xl italic mb-2" style={{ color: "#F9F3DB" }}>
              Contrato aceptado
            </p>
            <p className="text-sm" style={{ color: "rgba(249,243,219,0.55)" }}>
              Gracias, {data.clientName.split(" ")[0]}. Sofía recibirá la confirmación y te
              contactará con los próximos pasos.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {error && (
              <p className="text-sm" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}
            {data.canAccept && (
              <>
                <p className="text-xs" style={{ color: "rgba(249,243,219,0.45)" }}>
                  Al hacer click confirmás que leíste y aceptás los términos del contrato.
                </p>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void accept()}
                  className="rounded px-8 py-3 text-sm font-medium uppercase tracking-wider disabled:opacity-50"
                  style={{ background: "#F03172", color: "#fff" }}
                >
                  {submitting ? "Procesando…" : "Aceptar contrato"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
