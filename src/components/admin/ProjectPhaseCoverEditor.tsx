"use client";

import { useEffect, useRef, useState } from "react";
import { AdminUploadProgress } from "@/components/admin/AdminUploadProgress";
import { uploadPhaseCoverImageFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { reloadAdminWorkspacePreserveContext } from "@/lib/admin-reload";
import { brandUi } from "@/lib/brand-ui";

type ProjectPhaseCoverEditorProps = {
  label: string;
  coverUrl: string;
  phaseKey?: string;
  onPreviewChange?: (previewUrl: string | null) => void;
  onChange?: (coverUrl: string) => void;
  onSave?: (coverUrl: string) => Promise<boolean>;
};

export function ProjectPhaseCoverEditor({
  label,
  coverUrl,
  phaseKey,
  onPreviewChange,
  onChange,
  onSave,
}: ProjectPhaseCoverEditorProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const onPreviewChangeRef = useRef(onPreviewChange);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onPreviewChangeRef.current = onPreviewChange;
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
  });

  const displayUrl = coverUrl.trim() || localPreview || "";
  const hasCover = Boolean(displayUrl);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function persistCover(url: string) {
    setUploadProgress((prev) =>
      prev ? { ...prev, percentage: 95, phase: "save" } : { loaded: 0, total: 1, percentage: 95, phase: "save" },
    );
    const ok = onSaveRef.current ? await onSaveRef.current(url) : true;
    if (!ok) {
      setUploadError("No se pudo guardar la portada en el proyecto.");
      return false;
    }
    onChangeRef.current?.(url);
    return true;
  }

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;

    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setUploading(true);
    setUploadError(null);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
    setUploadingFileName(file.name);
    setUploadingFileSize(file.size);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const url = await uploadPhaseCoverImageFile(file, (event) => setUploadProgress(event));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const saved = await persistCover(url);
      if (saved) {
        setUploadProgress({ loaded: file.size, total: file.size, percentage: 100, phase: "save" });
        reloadAdminWorkspacePreserveContext({
          phaseKey,
          message: "Portada guardada",
          detail: "Volviendo al mismo lugar del proyecto…",
        });
        return;
      } else {
        setLocalPreview(null);
        onPreviewChangeRef.current?.(null);
      }
    } catch (e) {
      setLocalPreview(null);
      onPreviewChangeRef.current?.(null);
      setUploadError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      URL.revokeObjectURL(blobUrl);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleRemove() {
    if (uploading) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress({ loaded: 0, total: 1, percentage: 95, phase: "save" });
    try {
      const ok = onSaveRef.current ? await onSaveRef.current("") : true;
      if (!ok) {
        setUploadError("No se pudo quitar la portada.");
        return;
      }
      reloadAdminWorkspacePreserveContext({
        phaseKey,
        message: "Portada quitada",
        detail: "Volviendo al mismo lugar del proyecto…",
      });
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
          <AdminUploadProgress
            fileName={uploadingFileName}
            fileSize={uploadingFileSize}
            progress={uploadProgress}
            savingLabel="Guardando portada en el proyecto…"
          />
        )}
        {uploadError ? (
          <p className="text-[10px] mt-1" style={{ color: brandUi.accent }}>
            {uploadError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <label
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium border ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
          style={{ borderColor: brandUi.borderStrong }}
        >
          {hasCover ? "Cambiar imagen" : "Subir imagen"}
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
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
