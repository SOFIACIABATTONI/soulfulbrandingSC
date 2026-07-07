"use client";

import { useRef, useState } from "react";
import { brandUi } from "@/lib/brand-ui";
import type { ManualPdfMeta } from "@/lib/manual-pdf";

const MAX_BYTES = 150 * 1024 * 1024;

type ManualPdfPanelProps = {
  pdf: ManualPdfMeta | null;
  saving?: boolean;
  onSave: (payload: ManualPdfMeta | null) => Promise<boolean> | boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isPdfFile(file: File): boolean {
  const mime = (file.type ?? "").trim().toLowerCase();
  return mime === "application/pdf" || mime === "application/x-google-chrome-pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function uploadPdf(file: File): Promise<ManualPdfMeta> {
  if (!isPdfFile(file)) {
    throw new Error("Subí un archivo PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`El PDF pesa ${formatFileSize(file.size)}. Máximo ${Math.round(MAX_BYTES / (1024 * 1024))} MB.`);
  }

  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/admin/manual-pdf-upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const j = (await res.json().catch(() => ({}))) as {
    url?: string;
    fileName?: string;
    mime?: string;
    error?: string;
  };
  if (!res.ok || !j.url) throw new Error(j.error ?? "No se pudo subir el PDF.");
  return {
    url: j.url,
    fileName: j.fileName ?? file.name,
    mime: j.mime ?? "application/pdf",
  };
}

export function ManualPdfPanel({ pdf, saving = false, onSave }: ManualPdfPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openFilePicker() {
    if (uploading || saving) return;
    inputRef.current?.click();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const meta = await uploadPdf(file);
      const ok = await onSave(meta);
      setMessage(ok ? "PDF del manual guardado." : "No se pudo guardar.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  }

  async function removePdf() {
    if (!window.confirm("¿Quitar el PDF del manual?")) return;
    setMessage(null);
    const ok = await onSave(null);
    setMessage(ok ? "PDF eliminado." : "No se pudo eliminar.");
  }

  return (
    <div
      className="rounded-2xl border p-4 space-y-4"
      style={{ borderColor: brandUi.border, background: "rgba(240,49,114,0.04)" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={uploading || saving}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleUpload(f);
          e.target.value = "";
        }}
      />

      <div>
        <p className="text-sm font-medium" style={{ color: brandUi.text }}>
          Manual de marca — PDF final
        </p>
        <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
          Subí el PDF de entrega. Al enviarlo al cliente, recibe un mail con enlace permanente para
          descargarlo cuando quiera.
        </p>
      </div>

      {pdf ? (
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
              disabled={uploading || saving}
              onClick={openFilePicker}
              className="rounded-full px-3 py-1.5 text-[11px] font-medium border disabled:opacity-50"
              style={{ borderColor: brandUi.borderStrong }}
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => void removePdf()}
              disabled={uploading || saving}
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
          disabled={uploading || saving}
          onClick={openFilePicker}
          className="w-full flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 disabled:opacity-50"
          style={{ borderColor: brandUi.borderStrong, background: brandUi.surface }}
        >
          <span className="text-sm font-medium" style={{ color: brandUi.text }}>
            {uploading ? "Subiendo PDF…" : "Subir PDF del manual"}
          </span>
          <span className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            Máx. 150 MB · solo PDF
          </span>
        </button>
      )}

      {message && (
        <p
          className="text-xs"
          style={{ color: message.includes("No se") || message.includes("Error") || message.includes("Máximo") || message.includes("pesa") ? brandUi.accent : brandUi.textMuted }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
