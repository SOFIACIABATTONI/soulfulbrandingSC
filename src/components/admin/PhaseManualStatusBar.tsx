"use client";

import { useState } from "react";
import {
  PHASE_CLIENT_STATUS_LABELS,
  type PhaseClientMeta,
} from "@/lib/phase-client-store";
import type { WorkspacePhaseKey } from "@/lib/project-phase-sync";
import { WORKSPACE_PHASE_LABELS } from "@/lib/workspace-phase-labels";
import { brandUi } from "@/lib/brand-ui";

type PhaseManualStatusBarProps = {
  projectId: string;
  phaseKey: WorkspacePhaseKey | string;
  phaseLabel?: string;
  meta: PhaseClientMeta;
  onMetaChange?: (meta: PhaseClientMeta) => void;
  disabled?: boolean;
  hint?: string;
};

export function PhaseManualStatusBar({
  projectId,
  phaseKey,
  phaseLabel,
  meta,
  onMetaChange,
  disabled = false,
  hint,
}: PhaseManualStatusBarProps) {
  const [statusBusy, setStatusBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resolvedLabel =
    phaseLabel ??
    (phaseKey in WORKSPACE_PHASE_LABELS
      ? WORKSPACE_PHASE_LABELS[phaseKey as WorkspacePhaseKey]
      : String(phaseKey));

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
        ? `${resolvedLabel} marcada como recibida. La etapa queda completada.`
        : "Confirmación reabierta. Podés volver a marcar recibido o esperar confirmación del cliente.",
    );
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ borderColor: brandUi.border, background: "rgba(19,25,69,0.03)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: brandUi.text }}>
            Seguimiento — {resolvedLabel}
          </p>
          <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            {hint ??
              "Marcá manualmente si el cliente ya recibió esta etapa (por mail, WhatsApp u otro canal)."}
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

      <div className="flex flex-wrap gap-2">
        {meta.clientStatus !== "recibido" && (
          <button
            type="button"
            disabled={statusBusy || disabled}
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
            disabled={statusBusy || disabled}
            onClick={() => void updateClientStatus("reopen_ack")}
            className="rounded-full px-3 py-1.5 text-[11px] font-medium border disabled:opacity-50"
            style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
          >
            Reabrir confirmación
          </button>
        )}
      </div>

      {message && (
        <p className="text-xs" style={{ color: brandUi.textMuted }}>
          {message}
        </p>
      )}
    </div>
  );
}
