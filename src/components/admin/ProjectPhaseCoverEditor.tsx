"use client";

import { useEffect, useState } from "react";
import { uploadAdminImageFile } from "@/lib/admin-client-upload";
import { brandUi } from "@/lib/brand-ui";

type ProjectPhaseCoverEditorProps = {
  label: string;
  coverUrl: string;
  onUploadingChange?: (uploading: boolean) => void;
  onPreviewChange?: (previewUrl: string | null) => void;
  onChange: (coverUrl: string) => void;
};

export function ProjectPhaseCoverEditor({
  label,
  coverUrl,
  onUploadingChange,
  onPreviewChange,
  onChange,
}: ProjectPhaseCoverEditorProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const displayUrl = coverUrl.trim() || localPreview || "";
  const hasCover = Boolean(displayUrl);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (localPreview) URL.revokeObjectURL(localPreview);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    onPreviewChange?.(blobUrl);
    onUploadingChange?.(true);

    try {
      const url = await uploadAdminImageFile(file);
      onChange(url);
      setLocalPreview(null);
      onPreviewChange?.(null);
    } catch (e) {
      setLocalPreview(null);
      onPreviewChange?.(null);
      window.alert(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      URL.revokeObjectURL(blobUrl);
      onUploadingChange?.(false);
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
          {localPreview
            ? "Subiendo imagen… la vista previa se actualiza al instante."
            : hasCover
              ? "Cambiá la imagen de la card y del encabezado de esta etapa en este proyecto."
              : "Sin imagen — la card y el encabezado quedan en blanco hasta que subas una."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <label
          className="rounded-full px-3 py-1.5 text-[11px] font-medium border cursor-pointer"
          style={{ borderColor: brandUi.borderStrong }}
        >
          {hasCover ? "Cambiar imagen" : "Subir imagen"}
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              void handleFile(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {coverUrl.trim() && (
          <button
            type="button"
            className="text-[11px]"
            style={{ color: brandUi.accent }}
            onClick={() => {
              setLocalPreview(null);
              onPreviewChange?.(null);
              onChange("");
            }}
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  );
}
