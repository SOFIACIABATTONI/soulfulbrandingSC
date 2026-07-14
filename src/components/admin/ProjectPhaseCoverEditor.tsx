"use client";

import { useEffect, useState } from "react";
import { uploadPhaseCoverImageFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { brandUi } from "@/lib/brand-ui";

type ProjectPhaseCoverEditorProps = {
  label: string;
  coverUrl: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onChange?: (coverUrl: string) => void;
  onSave?: (coverUrl: string) => Promise<boolean>;
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function CoverUploadProgress({
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
      className="mt-3 rounded-xl border px-3 py-3 space-y-2 w-full"
      style={{ borderColor: brandUi.blue, background: "rgba(50,63,246,0.05)" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium" style={{ color: brandUi.text }}>
            {isSaving ? "Guardando portada en el proyecto…" : "Preparando y subiendo imagen…"}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: brandUi.textMuted }}>
            {fileName} · {formatFileSize(fileSize)}
          </p>
        </div>
        <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: brandUi.blue }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
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
    </div>
  );
}

export function ProjectPhaseCoverEditor({
  label,
  coverUrl,
  onPreviewChange,
  onChange,
  onSave,
}: ProjectPhaseCoverEditorProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState(0);
  const displayUrl = coverUrl.trim() || localPreview || "";
  const hasCover = Boolean(displayUrl);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function persistCover(url: string) {
    setUploadProgress((prev) =>
      prev ? { ...prev, percentage: 95, phase: "save" } : { loaded: 0, total: 1, percentage: 95, phase: "save" },
    );
    const ok = onSave ? await onSave(url) : true;
    if (!ok) {
      window.alert("No se pudo guardar la portada en el proyecto.");
      return false;
    }
    onChange?.(url);
    return true;
  }

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;

    if (localPreview) URL.revokeObjectURL(localPreview);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    onPreviewChange?.(blobUrl);
    setUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
    setUploadingFileName(file.name);
    setUploadingFileSize(file.size);

    try {
      const url = await uploadPhaseCoverImageFile(file, (event) => setUploadProgress(event));
      const saved = await persistCover(url);
      if (saved) {
        setLocalPreview(null);
        onPreviewChange?.(null);
      }
    } catch (e) {
      setLocalPreview(null);
      onPreviewChange?.(null);
      window.alert(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      URL.revokeObjectURL(blobUrl);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleRemove() {
    if (uploading) return;
    setUploading(true);
    setUploadProgress({ loaded: 0, total: 1, percentage: 95, phase: "save" });
    try {
      const ok = onSave ? await onSave("") : true;
      if (!ok) {
        window.alert("No se pudo quitar la portada.");
        return;
      }
      setLocalPreview(null);
      onPreviewChange?.(null);
      onChange?.("");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div
      className="rounded-xl border p-3 flex flex-wrap items-center gap-3"
      style={{ borderColor: brandUi.border, background: "rgba(255,255,255,0.92)" }}
    >
      <div
        className="h-16 w-28 rounded-lg border bg-neutral-50 shrink-0"
        style={{
          borderColor: brandUi.border,
          ...(hasCover
            ? {
                backgroundImage: `url("${displayUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}),
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium" style={{ color: brandUi.text }}>
          Portada — {label}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: brandUi.textMuted }}>
          {uploading
            ? "La vista previa se ve al instante; la barra indica el progreso real."
            : hasCover
              ? "Cambiá la imagen de la card y del encabezado de esta etapa en este proyecto."
              : "Sin imagen — la card y el encabezado quedan en blanco hasta que subas una."}
        </p>
        {uploadProgress && (
          <CoverUploadProgress
            fileName={uploadingFileName}
            fileSize={uploadingFileSize}
            progress={uploadProgress}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <label
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium border ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
          style={{ borderColor: brandUi.borderStrong }}
        >
          {hasCover ? "Cambiar imagen" : "Subir imagen"}
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void handleFile(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {coverUrl.trim() && (
          <button
            type="button"
            className="text-[11px] disabled:opacity-50"
            style={{ color: brandUi.accent }}
            disabled={uploading}
            onClick={() => void handleRemove()}
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  );
}
