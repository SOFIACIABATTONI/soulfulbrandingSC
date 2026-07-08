"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import { PrebriefTemplateEditor } from "@/components/admin/PrebriefTemplateEditor";
import { getDefaultPrebriefTemplate, type PrebriefTemplate } from "@/lib/prebrief-template";
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
  const [panelOpen, setPanelOpen] = useState(false);
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
          ? `Pre-brief enviado a ${clientEmail}.`
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
        Cargando pre-brief…
      </p>
    );
  }

  return (
    <Card className={cardClass} frameVariant={embedded ? "client" : "default"}>
      <Topbar
        title="Pre-brief (cliente)"
        subtitle={
          submitted
            ? `Recibido · ${new Date(data!.submittedAt!).toLocaleDateString("es-AR")}`
            : `${clientName} · editar y enviar cuestionario`
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

      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
        style={{ borderColor: brandUi.border }}
      >
        <p className="text-xs flex-1" style={{ color: brandUi.textMuted }}>
          {submitted
            ? "Las respuestas del cliente están abajo."
            : "Editá el cuestionario antes de enviar. El mail lleva solo la bienvenida + enlace; el formulario no repite ese texto."}
        </p>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="text-xs font-medium uppercase tracking-wider hover:opacity-80"
          style={{ color: brandUi.accent, background: "none", border: "none", cursor: "pointer" }}
          aria-expanded={panelOpen}
        >
          {submitted ? "Ver respuestas" : "Editar / enviar"} {panelOpen ? "↑" : "↓"}
        </button>
      </div>

      {submitted && hasAnswers && !panelOpen && (
        <div
          className="mt-4 rounded border p-4 space-y-3 max-h-48 overflow-y-auto text-sm"
          style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
        >
          {fieldsForDisplay.map((field) => {
            const val = data?.answers[field.id]?.trim();
            if (!val) return null;
            return (
              <div key={field.id}>
                <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: brandUi.textFaint }}>
                  {field.label}
                </p>
                <p className="leading-relaxed whitespace-pre-wrap" style={{ color: brandUi.text }}>
                  {val}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {panelOpen && (
        <div className="mt-4 pt-4 border-t space-y-6" style={{ borderColor: brandUi.border }}>
          {!submitted && (
            <>
              <PrebriefTemplateEditor
                projectId={projectId}
                template={template}
                onSaved={setTemplate}
              />

              <label className="block">
                <span
                  className="text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: brandUi.textFaint }}
                >
                  Nota personalizada (mail)
                </span>
                <textarea
                  className="mt-1 w-full rounded border p-2 text-sm min-h-[72px]"
                  style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
                  placeholder="Ej: Con mucho cariño para este proceso…"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={sending} onClick={() => void sendPrebrief()}>
                  {sending ? "Enviando…" : "Enviar pre-brief por correo →"}
                </Button>
              </div>
            </>
          )}

          {submitted && hasAnswers && (
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
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
                    {field.hint && (
                      <p className="text-[10px] italic mb-2" style={{ color: brandUi.textFaint }}>
                        {field.hint}
                      </p>
                    )}
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
      )}
    </Card>
  );
}
