"use client";

import { useCallback, useEffect, useState } from "react";
import { QuoteFormattedBody } from "@/components/quote/QuoteFormattedBody";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import {
  NARRATIVA_STATUS_LABELS,
  type NarrativaContent,
  type NarrativaStatus,
} from "@/lib/narrativa-types";
import { brandUi } from "@/lib/brand-ui";

type NarrativaPanelProps = {
  projectId: string;
  clientName: string;
  projectTitle: string;
  clientEmail: string;
  embedded?: boolean;
};

type NarrativaData = {
  content: NarrativaContent;
  status: NarrativaStatus;
  statusLabel: string;
  narrativaSentAt: string | null;
  narrativaAcknowledgedAt: string | null;
  client: { name: string; email: string };
};

export function NarrativaPanel({
  projectId,
  clientName,
  projectTitle,
  clientEmail,
  embedded = false,
}: NarrativaPanelProps) {
  const [data, setData] = useState<NarrativaData | null>(null);
  const [body, setBody] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as NarrativaData;
      setData(j);
      setBody(j.content.body ?? "");
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDraft() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: body.trim(), format: "markdown" as const },
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Borrador guardado.");
      void load();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo guardar.");
    }
  }

  async function sendNarrativa() {
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: body.trim(), format: "markdown" as const },
        personalNote: personalNote.trim() || undefined,
      }),
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
          ? `Narrativa enviada a ${clientEmail}.`
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
      <Card className={cardClass}>
        <Topbar title="Narrativa de marca" subtitle={`${clientName} · ${projectTitle}`} />
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          Cargando…
        </p>
      </Card>
    );
  }

  const status = data?.status ?? "borrador";
  const editorLabel = editorOpen ? "Ocultar editor" : "Editar narrativa";

  return (
    <Card className={cardClass}>
      <Topbar
        title="Narrativa de marca"
        subtitle={`${clientName} · completá y enviá al cliente`}
        actions={
          <span
            className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{
              background:
                status === "recibido"
                  ? "#e3f2e3"
                  : status === "enviado"
                    ? brandUi.accentSoft
                    : brandUi.navySoft,
              color:
                status === "recibido"
                  ? "#1a6b1a"
                  : status === "enviado"
                    ? brandUi.accent
                    : brandUi.textMuted,
            }}
          >
            {NARRATIVA_STATUS_LABELS[status]}
          </span>
        }
      />

      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t"
        style={{ borderColor: brandUi.border }}
      >
        <div className="text-xs space-y-0.5">
          {data?.narrativaSentAt ? (
            <p style={{ color: brandUi.textMuted }}>
              Enviado el{" "}
              {new Date(data.narrativaSentAt).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {data.narrativaAcknowledgedAt && (
                <>
                  {" "}
                  · Recibido el{" "}
                  {new Date(data.narrativaAcknowledgedAt).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </>
              )}
            </p>
          ) : (
            <p style={{ color: brandUi.textFaint }}>
              Completá el documento con la plantilla guía. Reemplazá cada{" "}
              <strong style={{ color: brandUi.textMuted }}>[Completar]</strong> y enviá al cliente
              cuando esté listo.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditorOpen((v) => !v)}
          className="text-xs font-medium uppercase tracking-wider hover:opacity-80 transition-opacity"
          style={{ color: brandUi.accent, background: "none", border: "none", cursor: "pointer" }}
          aria-expanded={editorOpen}
        >
          {editorLabel} {editorOpen ? "↑" : "↓"}
        </button>
      </div>

      {editorOpen && (
        <div
          className="mt-4 pt-4 border-t grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{ borderColor: brandUi.border }}
        >
          <div className="space-y-3">
            <label className="block">
              <span
                className="text-[9px] font-medium uppercase tracking-widest"
                style={{ color: brandUi.textFaint }}
              >
                Documento (Markdown)
              </span>
              <textarea
                className="mt-1 w-full rounded border p-3 text-sm font-mono leading-relaxed min-h-[360px]"
                style={{
                  borderColor: brandUi.borderStrong,
                  background: brandUi.surface,
                  color: brandUi.text,
                }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>

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
                placeholder="Ej: Acá está el mapa estratégico de tu marca…"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "Ocultar vista previa" : "Vista previa"}
              </Button>
              <Button variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
                {saving ? "Guardando…" : "Guardar borrador"}
              </Button>
              <Button
                variant="primary"
                disabled={sending || !body.trim()}
                onClick={() => void sendNarrativa()}
              >
                {sending ? "Enviando…" : "Enviar al cliente →"}
              </Button>
            </div>

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

          {showPreview && (
            <div
              className="rounded-lg border p-4 min-h-[360px] overflow-auto bg-white"
              style={{ borderColor: brandUi.border }}
            >
              <QuoteFormattedBody body={body} format="markdown" theme="light" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
