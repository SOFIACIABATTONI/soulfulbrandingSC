"use client";

import { useCallback, useEffect, useState } from "react";
import { PrebriefSetupModal } from "@/components/admin/prebrief/PrebriefSetupModal";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import { getDefaultPrebriefTemplate, visiblePrebriefFields, type PrebriefTemplate } from "@/lib/prebrief-template";
import { brandUi } from "@/lib/brand-ui";

type PrebriefPanelProps = {
  projectId: string;
  clientName: string;
  clientEmail: string;
  embedded?: boolean;
};

type PrebriefData = {
  submittedAt: string | null;
  answers: Record<string, string>;
  template: PrebriefTemplate;
};

export function PrebriefPanel({
  projectId,
  clientName,
  clientEmail,
  embedded = false,
}: PrebriefPanelProps) {
  const [data, setData] = useState<PrebriefData | null>(null);
  const [template, setTemplate] = useState<PrebriefTemplate>(getDefaultPrebriefTemplate());
  const [personalNote, setPersonalNote] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects-erp/${projectId}/prebrief`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as PrebriefData;
      setData(j);
      setTemplate(j.template ?? getDefaultPrebriefTemplate());
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitted = Boolean(data?.submittedAt);
  const hasAnswers = data?.answers && Object.values(data.answers).some((v) => v.trim());
  const fieldsForDisplay = template.fields;
  const visibleCount = visiblePrebriefFields(template.fields).length;

  async function sendPrebrief() {
    if (submitted) return;
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/prebrief/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalNote: personalNote.trim() || undefined }),
    });
    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as {
        publicUrl?: string;
        emailed?: boolean;
      };
      setLastLink(j.publicUrl ?? null);
      setMessage(
        j.emailed
          ? `Brand Soul enviado a ${clientEmail}.`
          : `Link generado. ${j.publicUrl ? "Configurá Resend para enviar el mail." : ""}`,
      );
      void load();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  const cardClass = embedded ? "rounded-2xl border shadow-sm" : "mb-6";

  if (loading) {
    return (
      <p className={`text-sm ${embedded ? "py-4" : "mb-6"}`} style={{ color: brandUi.textMuted }}>
        Cargando Brand Soul…
      </p>
    );
  }

  return (
    <>
      <Card className={cardClass} frameVariant={embedded ? "client" : "default"}>
        <Topbar
          title="Brand Soul"
          subtitle={
            submitted
              ? `Respondido por ${clientName} · ${new Date(data!.submittedAt!).toLocaleDateString("es-AR")}`
              : `${clientName} · cuestionario para el cliente`
          }
          actions={
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{
                background: submitted ? "#e3f2e3" : brandUi.navySoft,
                color: submitted ? "#1a6b1a" : brandUi.textMuted,
              }}
            >
              {submitted ? "Respondido" : "Pendiente"}
            </span>
          }
        />

        <div className="pt-4 space-y-4 border-t" style={{ borderColor: brandUi.border }}>
          {!submitted ? (
            <>
              <div
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
              >
                <p className="text-sm font-medium" style={{ color: brandUi.text }}>
                  {visibleCount} {visibleCount === 1 ? "pregunta activa" : "preguntas activas"}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
                  Configurá qué incluye el cuestionario y después enviá el mail con el enlace a{" "}
                  <strong>{clientEmail}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setSetupOpen(true)}>
                  Configurar cuestionario
                </Button>
                <Button variant="primary" disabled={sending || visibleCount === 0} onClick={() => void sendPrebrief()}>
                  {sending ? "Enviando…" : "Enviar por correo →"}
                </Button>
              </div>

              <label className="block">
                <span
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: brandUi.textFaint }}
                >
                  Nota personal en el mail (opcional)
                </span>
                <textarea
                  className="mt-1 w-full rounded border p-2 text-sm min-h-[64px]"
                  style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                  placeholder="Ej: Con mucho cariño para este proceso…"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: brandUi.textMuted }}>
                El cliente ya completó el cuestionario. Podés revisar las respuestas abajo.
              </p>
              <button
                type="button"
                onClick={() => setAnswersOpen((v) => !v)}
                className="text-xs font-medium uppercase tracking-wider hover:opacity-80"
                style={{ color: brandUi.accent, background: "none", border: "none", cursor: "pointer" }}
              >
                {answersOpen ? "Ocultar respuestas ↑" : "Ver respuestas ↓"}
              </button>
            </>
          )}

          {submitted && hasAnswers && answersOpen && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto">
              {fieldsForDisplay.map((field) => {
                const val = data?.answers[field.id]?.trim();
                if (!val) return null;
                return (
                  <div
                    key={field.id}
                    className="rounded border p-3"
                    style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
                  >
                    <p className="text-xs font-medium mb-2" style={{ color: brandUi.text }}>
                      {field.label}
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: brandUi.textMuted }}>
                      {val}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {message && (
            <p className="text-xs" style={{ color: brandUi.textMuted }}>
              {message}
            </p>
          )}
          {lastLink && (
            <p className="text-[10px] break-all" style={{ color: brandUi.blue }}>
              {lastLink}
            </p>
          )}
        </div>
      </Card>

      <PrebriefSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        projectId={projectId}
        template={template}
        disabled={submitted}
        onSaved={setTemplate}
      />
    </>
  );
}
