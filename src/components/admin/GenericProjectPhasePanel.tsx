"use client";

import { useEffect, useRef, useState } from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { brandUi, clientFrame } from "@/lib/brand-ui";
import { getPhaseClientMeta, type PhaseClientMeta } from "@/lib/phase-client-store";
import { PhaseManualStatusBar } from "@/components/admin/PhaseManualStatusBar";
import "@/components/admin/rich-text-editor.css";

const DEFAULT_GENERIC_HTML = `<h1>Documento para el cliente</h1>
<p>Escribí acá el contenido que verá tu cliente. Podés incluir links, listas e imágenes.</p>
<p><em>Ejemplo: instrucciones, entregables, formulario de testimonio, etc.</em></p>`;

type GenericProjectPhasePanelProps = {
  projectId: string;
  phaseKey: string;
  phaseTitle: string;
  clientEmail: string;
  saved: Record<string, string>;
  saving?: boolean;
  meta: PhaseClientMeta;
  onSave: (payload: { body: string; bodyFormat: "html" }) => Promise<boolean> | boolean;
  onSent: () => void;
  onMetaChange?: (meta: PhaseClientMeta) => void;
};

export function GenericProjectPhasePanel({
  projectId,
  phaseKey,
  phaseTitle,
  clientEmail,
  saved,
  saving = false,
  meta,
  onSave,
  onSent,
  onMetaChange,
}: GenericProjectPhasePanelProps) {
  const [html, setHtml] = useState(saved.body?.trim() || DEFAULT_GENERIC_HTML);
  const [message, setMessage] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef((saved.body?.trim() || DEFAULT_GENERIC_HTML).trim());

  useEffect(() => {
    const next = saved.body?.trim() || DEFAULT_GENERIC_HTML;
    setHtml(next);
    lastPersistedRef.current = next.trim();
  }, [saved.body]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  async function persist(nextHtml: string, opts?: { silent?: boolean }) {
    const trimmed = nextHtml.trim();
    if (trimmed === lastPersistedRef.current) return true;
    const ok = await onSave({ body: trimmed, bodyFormat: "html" });
    if (ok) {
      lastPersistedRef.current = trimmed;
      if (!opts?.silent) setMessage("Documento guardado.");
    } else if (!opts?.silent) {
      setMessage("No se pudo guardar.");
    }
    return ok;
  }

  function handleChange(next: string) {
    setHtml(next);
    setMessage(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(next, { silent: true }), 900);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border-2 p-4 space-y-4"
        style={{ borderColor: clientFrame.border, background: clientFrame.background }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: clientFrame.border }}>
            Documento para el cliente — {phaseTitle}
          </p>
          <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            Plantilla genérica: editá el contenido, enviá por mail y el cliente confirma recepción.
          </p>
        </div>

        <RichTextEditor value={html} onChange={handleChange} />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist(html)}
            className="rounded-full px-4 py-2 text-xs font-medium border disabled:opacity-50"
            style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
          >
            {saving ? "Guardando…" : "Guardar documento"}
          </button>
          {message && (
            <p className="text-xs" style={{ color: brandUi.textMuted }}>
              {message}
            </p>
          )}
        </div>

        <CustomPhaseClientSendBar
          projectId={projectId}
          phaseKey={phaseKey}
          phaseTitle={phaseTitle}
          htmlBody={html}
          clientEmail={clientEmail}
          meta={meta}
          onSent={onSent}
        />
      </div>

      <PhaseManualStatusBar
        projectId={projectId}
        phaseKey={phaseKey}
        phaseLabel={phaseTitle}
        meta={getPhaseClientMeta(saved)}
        onMetaChange={onMetaChange}
      />
    </div>
  );
}

function CustomPhaseClientSendBar({
  projectId,
  phaseKey,
  phaseTitle,
  htmlBody,
  clientEmail,
  meta,
  onSent,
}: {
  projectId: string;
  phaseKey: string;
  phaseTitle: string;
  htmlBody: string;
  clientEmail: string;
  meta: PhaseClientMeta;
  onSent?: () => void;
}) {
  const [personalNote, setPersonalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const canSend = Boolean(htmlBody.trim() && htmlBody !== "<p></p>");

  async function sendToClient() {
    setSending(true);
    setMessage(null);
    setLastLink(null);

    const res = await fetch(`/api/admin/projects-erp/${projectId}/phase-send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase: phaseKey,
        customTitle: phaseTitle,
        html: htmlBody.trim(),
        personalNote: personalNote.trim() || undefined,
      }),
    });

    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as { emailed?: boolean; publicUrl?: string };
      setLastLink(j.publicUrl ?? null);
      setMessage(
        j.emailed
          ? `Enviado a ${clientEmail}. El cliente puede confirmar recepción desde el enlace.`
          : "Enlace generado (revisá el mail en producción).",
      );
      onSent?.();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: brandUi.border, background: brandUi.surface }}
    >
      <p className="text-xs font-medium" style={{ color: brandUi.text }}>
        Enviar al cliente
      </p>
      <textarea
        className="w-full min-h-[64px] rounded border px-2 py-1.5 text-xs"
        style={{ borderColor: brandUi.borderStrong }}
        placeholder="Nota personal para el mail (opcional)"
        value={personalNote}
        onChange={(e) => setPersonalNote(e.target.value)}
      />
      <button
        type="button"
        disabled={!canSend || sending}
        onClick={() => void sendToClient()}
        className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        style={{ background: brandUi.blue }}
      >
        {sending ? "Enviando…" : "Enviar por mail"}
      </button>
      {meta.clientStatus && (
        <p className="text-[11px]" style={{ color: brandUi.textMuted }}>
          Estado cliente: {meta.clientStatus}
          {meta.clientSentAt ? ` · enviado ${meta.clientSentAt.slice(0, 10)}` : ""}
        </p>
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
  );
}
