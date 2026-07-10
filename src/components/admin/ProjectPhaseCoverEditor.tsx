"use client";

import { uploadAdminImageFile } from "@/lib/admin-client-upload";
import { brandUi } from "@/lib/brand-ui";

type ProjectPhaseCoverEditorProps = {
  label: string;
  coverUrl: string;
  onUploadingChange?: (uploading: boolean) => void;
  onChange: (coverUrl: string) => void;
};

export function ProjectPhaseCoverEditor({
  label,
  coverUrl,
  onUploadingChange,
  onChange,
}: ProjectPhaseCoverEditorProps) {
  const hasCover = Boolean(coverUrl.trim());

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    onUploadingChange?.(true);
    try {
      const url = await uploadAdminImageFile(file);
      onChange(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
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
            ? { backgroundImage: `url("${coverUrl.trim()}")`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}),
        }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium" style={{ color: brandUi.text }}>
          Portada — {label}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: brandUi.textMuted }}>
          {hasCover
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
        {hasCover && (
          <button
            type="button"
            className="text-[11px]"
            style={{ color: brandUi.accent }}
            onClick={() => onChange("")}
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  );
}
