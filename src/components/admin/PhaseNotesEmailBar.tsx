"use client";

import { useState } from "react";
import type { PhaseDocumentKey } from "@/lib/phase-document-templates";
import { PHASE_DOCUMENT_TITLES } from "@/lib/phase-document-templates";
import { brandUi } from "@/lib/brand-ui";

type PhaseNotesEmailBarProps = {
  projectId: string;
  phaseKey: PhaseDocumentKey;
  htmlBody: string;
  projectTitle: string;
};

export function PhaseNotesEmailBar({
  projectId,
  phaseKey,
  htmlBody,
  projectTitle,
}: PhaseNotesEmailBarProps) {
  const [personalNote, setPersonalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendNotesEmail() {
    setSending(true);
    setMessage(null);

    const res = await fetch(
      `/api/admin/projects-erp/${projectId}/phase-notes-email`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phaseKey,
          html: htmlBody.trim(),
          personalNote: personalNote.trim() || undefined,
        }),
      },
    );

    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as { emailed?: boolean };
      setMessage(
        j.emailed
          ? "Copia enviada a tu correo de admin."
          : "Configurá Resend para enviar el mail automáticamente.",
      );
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  const phaseTitle = PHASE_DOCUMENT_TITLES[phaseKey];

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ borderColor: brandUi.border, background: "rgba(19,25,69,0.03)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: brandUi.text }}>
          Enviar notas por correo
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: brandUi.textMuted }}>
          Te llega una copia con el contenido de <strong>{phaseTitle.toLowerCase()}</strong> del
          proyecto <em>{projectTitle}</em>. Es para tu archivo o para reenviar; no va al cliente.
        </p>
      </div>

      <label className="block">
        <span
          className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: brandUi.textFaint }}
        >
          Nota personalizada (opcional)
        </span>
        <textarea
          className="mt-1 w-full rounded border p-2 text-sm min-h-[56px]"
          style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
          placeholder="Ej: Copia de mis notas del pre-brief para revisar en el celular…"
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={sending || !htmlBody.trim()}
        onClick={() => void sendNotesEmail()}
        className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        style={{ background: brandUi.text }}
      >
        {sending ? "Enviando…" : "Enviarme copia por mail →"}
      </button>

      {message && (
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          {message}
        </p>
      )}
    </div>
  );
}
