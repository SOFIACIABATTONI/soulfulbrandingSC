"use client";

import { useRef, useState } from "react";
import { brandUi, clientFrame } from "@/lib/brand-ui";
import { uploadManualPdfFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { MANUAL_PDF_MAX_BYTES } from "@/lib/admin-blob-upload";
import type { ManualPdfMeta } from "@/lib/manual-pdf";
import type { PhaseClientSendActionsProps } from "@/components/admin/PhaseClientSendActions";
import { PhaseClientSendActions } from "@/components/admin/PhaseClientSendActions";

const MAX_BYTES = MANUAL_PDF_MAX_BYTES;

function isUploadErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("no se") ||
    lower.includes("error") ||
    lower.includes("máximo") ||
    lower.includes("pesa") ||
    lower.includes("requieren") ||
    lower.includes("token") ||
    lower.includes("cancelada")
  );
}

type ManualPdfPanelProps = {
  pdf: ManualPdfMeta | null;
  saving?: boolean;
  onSave: (payload: ManualPdfMeta | null) => Promise<boolean> | boolean;
  clientSend?: Omit<PhaseClientSendActionsProps, "htmlBody" | "manualPdfUrl" | "manualPdfFileName" | "manualPdfMime">;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ManualPdfUploadProgress({
  fileName,
  fileSize,
  progress,
}: {
  fileName: string;
  fileSize: number;
  progress: UploadProgressEvent;
}) {
  const pct = Math.max(0, Math.min(100, progress.percentage));
  const isSaving = progress.phase === "save" || pct >= 90;

  return (
    <div
      className="rounded-xl border px-4 py-4 space-y-3"
      style={{ borderColor: brandUi.blue, background: "rgba(50,63,246,0.05)" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: brandUi.text }}>
            {isSaving ? "Guardando manual en el proyecto…" : "Subiendo PDF del manual…"}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: brandUi.textMuted }}>
            {fileName} · {formatFileSize(fileSize)}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: brandUi.blue }}>
          {pct}%
        </span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(19,25,69,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${brandUi.blue}, #F03172)`,
          }}
        />
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: brandUi.textMuted }}>
        {isSaving
          ? "Casi listo — estamos registrando el archivo en el proyecto."
          : "Archivos grandes pueden tardar varios minutos. No cierres esta pestaña; no es un error mientras avance la barra."}
      </p>
    </div>
  );
}

export function ManualPdfPanel({ pdf, saving = false, onSave, clientSend }: ManualPdfPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  function openFilePicker() {
    if (uploading || saving) return;
    inputRef.current?.click();
  }

  async function handleUpload(file: File) {
    if (file.size > MAX_BYTES) {
      setMessage(`Máximo ${Math.round(MAX_BYTES / (1024 * 1024))} MB por manual.`);
      return;
    }
    setUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
    setUploadingFileName(file.name);
    setUploadingFileSize(file.size);
    setMessage(null);
    try {
      const meta = await uploadManualPdfFile(file, (event) => setUploadProgress(event));
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 95, phase: "save" });
      const ok = await onSave(meta);
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100, phase: "save" });
      setMessage(ok ? "PDF del manual guardado." : "No se pudo guardar.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadingFileName("");
      setUploadingFileSize(0);
    }
  }

  async function removePdf() {
    if (!window.confirm("¿Quitar el PDF del manual?")) return;
    setMessage(null);
    const ok = await onSave(null);
    setMessage(ok ? "PDF eliminado." : "No se pudo eliminar.");
  }

  const busy = uploading || saving;

  return (
    <div
      className="rounded-2xl border-2 p-4 space-y-4"
      style={{ borderColor: clientFrame.border, background: clientFrame.background }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleUpload(f);
          e.target.value = "";
        }}
      />

      <div>
        <p className="text-sm font-medium" style={{ color: clientFrame.border }}>
          Documento para el cliente — Manual de marca (PDF)
        </p>
        <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
          Subí el PDF de entrega. Al enviarlo al cliente, recibe un mail con enlace permanente para
          descargarlo cuando quiera.
        </p>
      </div>

      {uploading && uploadProgress && uploadingFileName ? (
        <ManualPdfUploadProgress
          fileName={uploadingFileName}
          fileSize={uploadingFileSize}
          progress={uploadProgress}
        />
      ) : pdf ? (
        <div
          className="rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: brandUi.border, background: brandUi.surface }}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: brandUi.text }}>
              {pdf.fileName}
            </p>
            <a
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
              style={{ color: brandUi.blue }}
            >
              Ver PDF →
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={openFilePicker}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium border disabled:opacity-50"
              style={{ borderColor: brandUi.borderStrong }}
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => void removePdf()}
              disabled={busy}
              className="text-[11px]"
              style={{ color: brandUi.accent }}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openFilePicker}
          className="w-full flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 disabled:opacity-50"
          style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
        >
          <span className="text-sm font-medium" style={{ color: brandUi.text }}>
            Subir PDF del manual
          </span>
          <span className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            Máx. 150 MB · solo PDF · archivos grandes se suben directo a Blob
          </span>
        </button>
      )}

      {message && (
        <p
          className="text-xs"
          style={{ color: isUploadErrorMessage(message) ? "#F03172" : "rgba(19,25,69,0.52)" }}
        >
          {message}
        </p>
      )}

      {clientSend && (
        <PhaseClientSendActions
          {...clientSend}
          htmlBody=""
          manualPdfUrl={pdf?.url ?? ""}
          manualPdfFileName={pdf?.fileName ?? ""}
          manualPdfMime={pdf?.mime ?? ""}
        />
      )}
    </div>
  );
}
