"use client";

import { useEffect, useState } from "react";
import { PortalCard, PortalShell } from "@/components/portal/PortalShell";
import { brandUi } from "@/lib/brand-ui";
import type { PrebriefField } from "@/lib/prebrief-content";
import "@/components/admin/rich-text-editor.css";

type PrebriefPayload = {
  clientName: string;
  projectTitle: string;
  fields: PrebriefField[];
  intro: {
    questionnaire: string;
    outro: string;
  };
  answers: Record<string, string>;
  submitted: boolean;
  submittedAt: string | null;
  canSubmit: boolean;
  error?: string;
};

function PrebriefHtmlBody({ html }: { html: string }) {
  if (!html.trim()) return null;
  return (
    <div
      className="phase-doc-html max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function PrebriefSuccessView({
  data,
  answers,
}: {
  data: PrebriefPayload;
  answers: Record<string, string>;
}) {
  const firstName = data.clientName.split(" ")[0];
  const hasAnswers = Object.keys(answers).some((k) => answers[k]?.trim());

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Brand Soul enviado"
      subtitle={`Gracias, ${firstName}. Sofía recibió tus respuestas.`}
    >
      <PortalCard className="max-w-lg mx-auto text-center py-6 sm:py-10">
        <p className="text-4xl mb-4" aria-hidden>
          ✓
        </p>
        <p className="font-serif text-2xl italic mb-3" style={{ color: brandUi.text }}>
          Brand Soul recibido
        </p>
        <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: brandUi.textMuted }}>
          Gracias por tomarte este espacio. Sofía revisará tus respuestas y te escribirá para
          coordinar la primera sesión.
        </p>

        {hasAnswers && (
          <details className="mt-8 text-left border-t pt-6" style={{ borderColor: brandUi.border }}>
            <summary
              className="cursor-pointer text-sm font-medium list-none [&::-webkit-details-marker]:hidden"
              style={{ color: brandUi.text }}
            >
              Ver copia de tus respuestas
            </summary>
            <div className="mt-4 space-y-5">
              {data.fields.map((field) => {
                const val = answers[field.id]?.trim();
                if (!val) return null;
                return (
                  <div key={field.id}>
                    <p className="text-xs font-medium mb-1" style={{ color: brandUi.text }}>
                      {field.label}
                    </p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: brandUi.textMuted }}>
                      {val}
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </PortalCard>
    </PortalShell>
  );
}

export function PrebriefClient({ token }: { token: string }) {
  const [data, setData] = useState<PrebriefPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [done]);

  useEffect(() => {
    void (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25_000);
      try {
        const res = await fetch(`/api/public/prebrief/${encodeURIComponent(token)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? "Este enlace no es válido o expiró.");
          return;
        }
        const j = (await res.json()) as PrebriefPayload;
        setData(j);
        setAnswers(j.answers ?? {});
        if (j.submitted) setDone(true);
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === "AbortError";
        setError(
          aborted
            ? "La carga tardó demasiado. Recargá la página. Si persiste, reiniciá npm run dev (solo un servidor en el puerto 3000)."
            : "No se pudo cargar Brand Soul. Recargá la página o contactá a Sofía.",
        );
      } finally {
        window.clearTimeout(timeout);
        setLoading(false);
      }
    })();
  }, [token]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/prebrief/${encodeURIComponent(token)}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo enviar Brand Soul.");
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <PortalShell>
        <p className="text-center text-sm" style={{ color: brandUi.textMuted }}>
          Cargando Brand Soul…
        </p>
      </PortalShell>
    );
  }

  if (!data) {
    return (
      <PortalShell title="Enlace no disponible">
        <p className="text-center text-sm text-brand-magenta">
          {error ?? "No se pudo cargar Brand Soul."}
        </p>
      </PortalShell>
    );
  }

  if (done) {
    return <PrebriefSuccessView data={data} answers={answers} />;
  }

  let qNum = 0;

  return (
    <PortalShell
      eyebrow="Soulful Branding®"
      title="Tu Brand Soul"
      subtitle={`${data.clientName} · ${data.projectTitle}`}
    >
      <PortalCard className="max-w-2xl mx-auto space-y-8">
        <div
          className="rounded-xl border px-4 py-4 sm:px-5 sm:py-5"
          style={{ borderColor: brandUi.border, background: "rgba(249,243,219,0.35)" }}
        >
          <PrebriefHtmlBody html={data.intro.questionnaire} />
        </div>

        <div className="space-y-8">
          {data.fields.map((field) => {
            if (field.id.startsWith("q")) qNum += 1;
            return (
              <div key={field.id} className="space-y-2">
                {field.sectionTitle && (
                  <div className="pt-4 border-t" style={{ borderColor: brandUi.border }}>
                    <h2
                      className="font-serif text-xl italic mb-2"
                      style={{ color: brandUi.text }}
                    >
                      {field.sectionTitle}
                    </h2>
                    {field.sectionIntro && (
                      <PrebriefHtmlBody html={field.sectionIntro} />
                    )}
                  </div>
                )}
                <label className="block">
                  <span
                    className="block text-sm font-medium leading-snug mb-1"
                    style={{ color: brandUi.text }}
                  >
                    {field.id.startsWith("q") ? `${qNum}. ${field.label}` : field.label}
                  </span>
                  {field.hint && (
                    <span
                      className="block text-xs mb-2 italic leading-relaxed"
                      style={{ color: brandUi.textMuted }}
                    >
                      {field.hint}
                    </span>
                  )}
                  <textarea
                    className="w-full rounded-lg border px-4 py-3 text-sm leading-relaxed resize-y"
                    style={{
                      borderColor: brandUi.borderStrong,
                      color: brandUi.text,
                      minHeight: (field.rows ?? 4) * 28,
                    }}
                    rows={field.rows ?? 4}
                    value={answers[field.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder="Escribí tu respuesta aquí…"
                  />
                </label>
              </div>
            );
          })}

          <PrebriefHtmlBody html={data.intro.outro} />
          {error && (
            <p
              className="text-sm rounded px-3 py-2"
              style={{ background: "#FEF2F2", color: "#b91c1c" }}
            >
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="w-full rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: brandUi.accent }}
          >
            {submitting ? "Enviando…" : "Enviar Brand Soul →"}
          </button>
        </div>
      </PortalCard>
    </PortalShell>
  );
}
