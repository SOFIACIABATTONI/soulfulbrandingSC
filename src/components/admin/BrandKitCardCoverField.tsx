"use client";

import { useEffect, useState } from "react";
import { AdminUploadProgress } from "@/components/admin/AdminUploadProgress";
import { uploadBrandAssetFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { resolveBrandAssetMime } from "@/lib/admin-blob-upload";
import { brandUi } from "@/lib/brand-ui";
import {
  cardCoverImage,
  createBrandKitId,
  type BrandKitAssetFile,
  type BrandKitCard,
} from "@/lib/brand-kit";

type BrandKitCardCoverFieldProps = {
  card: BrandKitCard;
  disabled?: boolean;
  onPreviewChange?: (previewUrl: string | null) => void;
  onSaveCover: (coverFiles: BrandKitAssetFile[]) => Promise<boolean>;
  onUploadActivityChange?: (active: boolean) => void;
};

export function BrandKitCardCoverField({
  card,
  disabled = false,
  onPreviewChange,
  onSaveCover,
  onUploadActivityChange,
}: BrandKitCardCoverFieldProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const savedCover = cardCoverImage(card);
  const displayUrl = localPreview || savedCover || "";
  const hasCover = Boolean(displayUrl);
  const busy = disabled || uploading;

  useEffect(() => {
    onUploadActivityChange?.(uploading);
  }, [uploading, onUploadActivityChange]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    if (!localPreview || localPreview.startsWith("blob:")) return;
    const saved = cardCoverImage(card);
    if (saved && saved === localPreview) {
      setLocalPreview(null);
      onPreviewChange?.(null);
    }
  }, [card, localPreview, onPreviewChange]);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || busy) return;

    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    onPreviewChange?.(blobUrl);
    setUploading(true);
    setUploadError(null);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
    setUploadingFileName(file.name);
    setUploadingFileSize(file.size);

    try {
      setUploadProgress({ loaded: Math.round(file.size * 0.15), total: file.size, percentage: 20, phase: "upload" });
      const uploaded = await uploadBrandAssetFile(file);
      const mime = uploaded.mime || resolveBrandAssetMime(file) || file.type || "image/jpeg";

      setUploadProgress({ loaded: file.size, total: file.size, percentage: 92, phase: "save" });

      const coverFile: BrandKitAssetFile = {
        id: createBrandKitId(),
        url: uploaded.url,
        fileName: uploaded.fileName || file.name,
        mime,
      };
      const ok = await onSaveCover([coverFile]);
      if (!ok) {
        setUploadError("No se pudo guardar la portada en Brand ID.");
        setLocalPreview(null);
        onPreviewChange?.(null);
        return;
      }

      setLocalPreview(uploaded.url);
      onPreviewChange?.(uploaded.url);
    } catch (e) {
      setLocalPreview(null);
      onPreviewChange?.(null);
      setUploadError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      URL.revokeObjectURL(blobUrl);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress({ loaded: 0, total: 1, percentage: 95, phase: "save" });
    try {
      const ok = await onSaveCover([]);
      if (!ok) {
        setUploadError("No se pudo quitar la portada.");
        return;
      }
      setLocalPreview(null);
      onPreviewChange?.(null);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: brandUi.border }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium" style={{ color: brandUi.text }}>
            Imagen de portada
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: brandUi.textMuted }}>
            {uploading
              ? "La vista previa se ve al instante; la barra indica el progreso real."
              : "Independiente de los archivos de abajo. Es lo que se ve en el grid y en el portal del cliente."}
          </p>
        </div>
        {hasCover && !uploading && (
          <button
            type="button"
            className="text-[11px] shrink-0"
            style={{ color: brandUi.accent }}
            onClick={() => void handleRemove()}
          >
            Quitar
          </button>
        )}
      </div>

      {hasCover ? (
        <div
          className="relative aspect-[5/2] max-w-md rounded-lg overflow-hidden border"
          style={{ borderColor: brandUi.border }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt={`Portada ${card.title}`} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="aspect-[5/2] max-w-md rounded-lg border flex items-center justify-center"
          style={{ borderColor: brandUi.border, background: "rgba(50,63,246,0.04)" }}
        >
          <span className="text-[10px] text-center px-3" style={{ color: brandUi.textFaint }}>
            Sin portada propia — si no subís una acá, el grid puede usar un logo de los archivos de abajo
          </span>
        </div>
      )}

      {uploadProgress ? (
        <AdminUploadProgress
          fileName={uploadingFileName}
          fileSize={uploadingFileSize}
          progress={uploadProgress}
          savingLabel="Guardando portada en Brand ID…"
          className="mt-0"
        />
      ) : null}

      {uploadError ? (
        <p className="text-[10px]" style={{ color: brandUi.accent }}>
          {uploadError}
        </p>
      ) : null}

      {disabled && !uploading ? (
        <p className="text-[10px]" style={{ color: brandUi.textMuted }}>
          Esperá a que terminen de subir los archivos de la sección.
        </p>
      ) : null}

      <label
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border ${busy ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
      >
        {uploading ? "Subiendo…" : hasCover ? "Cambiar imagen" : "Subir imagen de portada"}
        <input
          type="file"
          accept="image/*,.svg"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void handleFile(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
