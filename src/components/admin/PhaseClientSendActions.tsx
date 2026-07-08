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

export type PhaseClientSendActionsProps = {
  projectId: string;
  phaseKey: HtmlPhaseKey;
  htmlBody?: string;
  brandKitJson?: string;
  manualPdfUrl?: string;
  manualPdfFileName?: string;
  manualPdfMime?: string;
  clientEmail: string;
  meta: PhaseClientMeta;
  onSent?: () => void;
};

export function PhaseClientSendActions({
  projectId,
  phaseKey,
  htmlBody = "",
  brandKitJson = "",
  manualPdfUrl = "",
  manualPdfFileName = "",
  manualPdfMime = "",
  clientEmail,
  meta,
  onSent,
}: PhaseClientSendActionsProps) {
  const config = HTML_PHASE_SEND[phaseKey];
  const isPermanent = isPermanentAccessPurpose(config.purpose);
  const isManual = phaseKey === "manual";
  const canSend = isManual
    ? Boolean(manualPdfUrl.trim())
    : Boolean(htmlBody.trim()) || brandKitHasContent(parseBrandKit(brandKitJson));
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);

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
        ...(phaseKey === "identidad" ? { brandKit: brandKitJson } : {}),
        ...(phaseKey === "manual"
          ? {
              manualPdfUrl,
              manualPdfFileName,
              manualPdfMime,
            }
          : {}),
      }),
    });

    setSending(false);
    if (res.ok) {
      const j = (await res.json()) as { emailed?: boolean; publicUrl?: string };
      setLastLink(j.publicUrl ?? null);
      setMessage(
        j.emailed
          ? isManual
            ? `Mail enviado a ${clientEmail}.`
            : `Mail enviado a ${clientEmail}.`
          : "Link generado. Configurá Resend para enviar el mail automáticamente.",
      );
      onSent?.();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(j.error ?? "No se pudo enviar.");
    }
  }

  return (
    <div
      className="space-y-3 pt-4 border-t"
      style={{ borderColor: "rgba(240,49,114,0.22)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs leading-relaxed" style={{ color: brandUi.textMuted }}>
          {isManual
            ? "El mail incluye un enlace permanente para descargar el PDF."
            : isPermanent
              ? "El mail incluye un enlace al portal donde el cliente ve el mensaje de arriba y el Brand ID."
              : "El mail incluye un enlace al portal con el mensaje de arriba."}
        </p>
        <span
          className="text-[10px] font-medium uppercase tracking-wide rounded px-2 py-1 shrink-0"
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

      <button
        type="button"
        disabled={sending || !canSend}
        onClick={() => void sendToClient()}
        className="rounded-full px-5 py-2.5 text-xs font-medium text-white disabled:opacity-50"
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
    </div>
  );
}
