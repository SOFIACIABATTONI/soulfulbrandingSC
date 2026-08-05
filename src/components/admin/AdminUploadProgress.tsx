"use client";

import { brandUi } from "@/lib/brand-ui";
import type { UploadProgressEvent } from "@/lib/admin-client-upload";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Props = {
  fileName: string;
  fileSize: number;
  progress: UploadProgressEvent;
  savingLabel?: string;
  uploadingLabel?: string;
  className?: string;
};

export function AdminUploadProgress({
  fileName,
  fileSize,
  progress,
  savingLabel = "Guardando…",
  uploadingLabel = "Preparando y subiendo imagen…",
  className = "mt-3",
}: Props) {
  const pct = Math.max(0, Math.min(100, progress.percentage));
  const isSaving = progress.phase === "save" || pct >= 90;

  return (
    <div
      className={`rounded-xl border px-3 py-3 space-y-2 w-full ${className}`}
      style={{ borderColor: brandUi.blue, background: "rgba(50,63,246,0.05)" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium" style={{ color: brandUi.text }}>
            {isSaving ? savingLabel : uploadingLabel}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: brandUi.textMuted }}>
            {fileName} · {formatFileSize(fileSize)}
          </p>
        </div>
        <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: brandUi.blue }}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(19,25,69,0.08)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${brandUi.blue}, #F03172)`,
          }}
        />
      </div>
    </div>
  );
}
