"use client";

import { useState } from "react";
import type { HtmlPhaseKey } from "@/lib/phase-client-flow";
import { HTML_PHASE_SEND } from "@/lib/phase-client-flow";
import { isPermanentAccessPurpose } from "@/lib/access-token";
import { brandKitHasContent, parseBrandKit } from "@/lib/brand-kit";
import {
  PHASE_CLIENT_STATUS_LABELS,
  type PhaseClientMeta,
} from "@/lib/phase-client-store";
import { brandUi } from "@/lib/brand-ui";

type PhaseClientSendBarProps = {
  projectId: string;
  phaseKey: HtmlPhaseKey;
  htmlBody: string;
  brandKitJson?: string;
  manualPdfUrl?: string;
  clientEmail: string;
  meta: PhaseClientMeta;
  onSent?: () => void;
  onMetaChange?: (meta: PhaseClientMeta) => void;
};

export function PhaseClientSendBar({
  projectId,
  phaseKey,
  htmlBody,
  brandKitJson = "",
  manualPdfUrl = "",
  clientEmail,
  meta,
  onSent,
  onMetaChange,
}: PhaseClientSendBarProps) {
  const config = HTML_PHASE_SEND[phaseKey];
  const isPermanent = isPermanentAccessPurpose(config.purpose);
  const isManual = phaseKey === "manual";
  const canSend = isManual
    ? Boolean(manualPdfUrl.trim())
    : Boolean(htmlBody.trim()) || brandKitHasContent(parseBrandKit(brandKitJson));
  const [personalNote, setPersonalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

  async function updateClientStatus(action: "mark_received" | "reopen_ack") {
    setStatusBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/projects-erp/${projectId}/phase-client-status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: phaseKey, action }),
    });
    setStatusBusy(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo actualizar el estado.");
      return;
    }
    const j = (await res.json()) as {
      phases?: Record<string, Record<string, string>>;
    };
    const phaseData = j.phases?.[phaseKey];
    if (phaseData) {
      onMetaChange?.({
        clientStatus: (phaseData.clientStatus as PhaseClientMeta["clientStatus"]) || "borrador",
        clientSentAt: phaseData.clientSentAt ?? "",
        clientReceivedAt: phaseData.clientReceivedAt ?? "",
      });
    }
    setMessage(
      action === "mark_received"
        ? "Marcado como recibido. La fase queda completada."
        : "Confirmación reabierta. El cliente puede volver a marcar recibido.",
    );
  }

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
          ? isManual
            ? `Enviado a ${clientEmail}. El cliente puede descargar el PDF desde el mail (enlace permanente).`
            : isPermanent
              ? `Enviado a ${clientEmail}. El enlace no vence: el cliente puede consultarlo y descargarlo cuando quiera.`
              : `Enviado a ${clientEmail}. El cliente puede confirmar recibido desde el mail.`
          : isManual
            ? "Link generado. Configurá Resend para enviar el mail automáticamente."
            : isPermanent
              ? "Link permanente generado. Configurá Resend para enviar el mail automáticamente."
              : `Link generado. Configurá Resend para enviar el mail automáticamente.`,
      );
      onSent?.();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ borderColor: brandUi.border, background: "rgba(50,63,246,0.04)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: brandUi.text }}>
            Enviar al cliente
          </p>
          <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            {isManual
              ? "Se envía el PDF del manual por mail con enlace permanente para descargarlo cuando quiera."
              : isPermanent
                ? "El documento se envía por mail con un enlace permanente. El cliente puede verlo, descargarlo y confirmar recibido."
                : "El documento de arriba se envía por mail. El cliente lo revisa y confirma recibido."}
          </p>
        </div>
        <span
          className="text-[10px] font-medium uppercase tracking-wide rounded px-2 py-1"
          style={{
            background:
              meta.clientStatus === "recibido"
                ? "#e3f2e3"
                : meta.clientStatus === "enviado"
                  ? brandUi.accentSoft
                  : brandUi.navySoft,
            color:
              meta.clientStatus === "recibido"
                ? "#1a6b1a"
                : meta.clientStatus === "enviado"
                  ? brandUi.accent
                  : brandUi.textMuted,
          }}
        >
          {PHASE_CLIENT_STATUS_LABELS[meta.clientStatus]}
        </span>
      </div>

      {meta.clientSentAt && (
        <p className="text-[11px]" style={{ color: brandUi.textFaint }}>
          Último envío:{" "}
          {new Date(meta.clientSentAt).toLocaleString("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          {meta.clientReceivedAt &&
            ` · Recibido: ${new Date(meta.clientReceivedAt).toLocaleString("es-AR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}`}
        </p>
      )}

      <label className="block">
        <span
          className="text-[9px] font-medium uppercase tracking-widest"
          style={{ color: brandUi.textFaint }}
        >
          Nota personalizada (mail)
        </span>
        <textarea
          className="mt-1 w-full rounded border p-2 text-sm min-h-[56px]"
          style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
          placeholder={`Ej: Te comparto ${config.title.toLowerCase()}…`}
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={sending || !canSend}
        onClick={() => void sendToClient()}
        className="rounded-full px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
        style={{ background: brandUi.accent }}
      >
        {sending ? "Enviando…" : `Enviar ${config.title.toLowerCase()} al cliente →`}
      </button>

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

      <div
        className="rounded-xl border px-3 py-3 space-y-2"
        style={{ borderColor: brandUi.border, background: brandUi.surface }}
      >
        <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
          Seguimiento manual
        </p>
        <div className="flex flex-wrap gap-2">
          {meta.clientStatus !== "recibido" && (
            <button
              type="button"
              disabled={statusBusy || sending}
              onClick={() => void updateClientStatus("mark_received")}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium border disabled:opacity-50"
              style={{ borderColor: "#1a6b1a", color: "#1a6b1a" }}
            >
              Marcar recibido (manual)
            </button>
          )}
          {meta.clientStatus === "recibido" && (
            <button
              type="button"
              disabled={statusBusy || sending}
              onClick={() => void updateClientStatus("reopen_ack")}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium border disabled:opacity-50"
              style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
            >
              Reabrir confirmación del cliente
            </button>
          )}
        </div>
        <p className="text-[10px]" style={{ color: brandUi.textFaint }}>
          Al reenviar el archivo, el cliente vuelve a poder confirmar recibido automáticamente.
        </p>
      </div>
    </div>
  );
}
