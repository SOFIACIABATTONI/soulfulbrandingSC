"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Topbar } from "@/components/admin/ui/Topbar";
import {
  getNarrativaHtmlTemplate,
  resolveNarrativaHtml,
} from "@/lib/narrativa-html-templates";
import {
  NARRATIVA_STATUS_LABELS,
  type NarrativaContent,
  type NarrativaStatus,
} from "@/lib/narrativa-types";
import { brandUi } from "@/lib/brand-ui";
import "@/components/admin/rich-text-editor.css";

type NarrativaPanelProps = {
  projectId: string;
  clientName: string;
  projectTitle: string;
  clientEmail: string;
  embedded?: boolean;
};

type NarrativaData = {
  status: NarrativaStatus;
  statusLabel: string;
  narrativaSentAt: string | null;
  narrativaAcknowledgedAt: string | null;
  client: { name: string; email: string };
  project: { id: string; title: string };
};

export function NarrativaPanel({
  projectId,
  clientName,
  projectTitle,
  clientEmail,
  embedded = false,
}: NarrativaPanelProps) {
  const [data, setData] = useState<NarrativaData | null>(null);
  const [html, setHtml] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectInput = useMemo(
    () =>
      data
        ? {
            title: data.project.title,
            client: { name: data.client.name },
          }
        : null,
    [data],
  );

  const defaultHtml = useMemo(
    () => (projectInput ? getNarrativaHtmlTemplate(projectInput) : ""),
    [projectInput],
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa`, {
      credentials: "include",
    });
    if (res.ok) {
      const j = (await res.json()) as NarrativaData & {
        content: NarrativaContent;
      };
      setData(j);
      setHtml(
        resolveNarrativaHtml(j.content, {
          title: j.project.title,
          client: j.client,
        }),
      );
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const isLocked = data?.status === "recibido";
  const canEdit = data?.status === "borrador" || data?.status === "enviado";

  async function saveDraft(nextHtml = html) {
    if (!canEdit || isLocked) return;
    const trimmed = nextHtml.trim();
    if (!trimmed) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: trimmed, format: "html" as const },
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

  function persistDraft(nextHtml: string) {
    setHtml(nextHtml);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveDraft(nextHtml), 900);
  }

  async function sendNarrativa() {
    if (isLocked) return;
    await saveDraft(html);
    setSending(true);
    setMessage(null);
    setLastLink(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/narrativa/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { body: html.trim(), format: "html" as const },
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

  function restoreTemplate() {
    if (!projectInput || isLocked) return;
    if (
      !window.confirm(
        "¿Volver al modelo original de la narrativa?\n\nSe reemplazará el texto actual por la plantilla inicial.",
      )
    ) {
      return;
    }
    setHtml(defaultHtml);
    void saveDraft(defaultHtml);
  }

  const cardClass = embedded ? "rounded-2xl border shadow-sm" : "mb-6";

  if (loading) {
    return (
      <Card className={cardClass} frameVariant={embedded ? "client" : "default"}>
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
    <Card className={cardClass} frameVariant={embedded ? "client" : "default"}>
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
              Editá con el mismo editor visual que contrato y pre-brief. Reemplazá cada{" "}
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
        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: brandUi.border }}>
          <div
            className="rounded-2xl border-2 px-4 py-3"
            style={{ borderColor: "#F03172", background: "rgba(240,49,114,0.06)" }}
          >
            <p className="text-sm font-medium" style={{ color: "#F03172" }}>
              Documento para el cliente — narrativa
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
              Mismo editor que contrato y pre-brief: negritas, listas, tablas y checkboxes. El
              cliente lo ve igual en el enlace del mail.
            </p>
          </div>

          {!isLocked && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={restoreTemplate}
                className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-neutral-50"
                style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
              >
                Volver al modelo original
              </button>
              {saving && (
                <span className="text-[11px] ml-auto" style={{ color: brandUi.blue }}>
                  Guardando…
                </span>
              )}
            </div>
          )}

          {isLocked ? (
            <div
              className="phase-doc-html max-w-none rounded-lg border p-4 bg-white"
              style={{ borderColor: brandUi.border }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <RichTextEditor
              value={html}
              ariaLabel="Narrativa de marca"
              placeholder="Completá la narrativa…"
              frameVariant="client"
              onChange={persistDraft}
              onBlur={() => void saveDraft()}
            />
          )}

          {!isLocked && (
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
          )}

          {!isLocked && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" disabled={saving} onClick={() => void saveDraft()}>
                {saving ? "Guardando…" : "Guardar borrador"}
              </Button>
              <Button
                variant="primary"
                disabled={sending || !html.trim()}
                onClick={() => void sendNarrativa()}
              >
                {sending ? "Enviando…" : "Enviar al cliente →"}
              </Button>
            </div>
          )}

          <details
            className="rounded-lg border group"
            style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
          >
            <summary
              className="cursor-pointer list-none px-4 py-3 text-xs font-medium uppercase tracking-wider select-none [&::-webkit-details-marker]:hidden"
              style={{ color: brandUi.accent }}
            >
              Vista previa (como la ve el cliente){" "}
              <span className="text-[10px] normal-case tracking-normal" style={{ color: brandUi.textMuted }}>
                — desplegar
              </span>
            </summary>
            <div
              className="border-t px-4 py-4 bg-white"
              style={{ borderColor: brandUi.border }}
            >
              <p className="text-[10px] mb-3 leading-relaxed" style={{ color: brandUi.textFaint }}>
                Así verá el documento al abrir el enlace del mail (no va el texto completo en el
                correo).
              </p>
              <div
                className="phase-doc-html max-w-none rounded-lg border p-4 bg-white max-h-[480px] overflow-y-auto"
                style={{ borderColor: brandUi.border }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </details>

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
