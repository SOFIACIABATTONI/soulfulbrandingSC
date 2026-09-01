"use client";

import { useEffect, useState } from "react";
import { AdminUploadProgress } from "@/components/admin/AdminUploadProgress";
import {
  uploadBrandAssetFile,
  uploadPhaseCoverImageFile,
  type UploadProgressEvent,
} from "@/lib/admin-client-upload";
import { resolveBrandAssetMime } from "@/lib/admin-blob-upload";
import { brandUi } from "@/lib/brand-ui";
import {
  cardPreviewImage,
  createBrandKitId,
  setCardCoverFiles,
  type BrandKitAssetFile,
  type BrandKitCard,
} from "@/lib/brand-kit";

type BrandKitCardCoverFieldProps = {
  card: BrandKitCard;
  onPreviewChange?: (previewUrl: string | null) => void;
  onSaveCover: (card: BrandKitCard) => Promise<boolean>;
  onUploadActivityChange?: (active: boolean) => void;
};

/** Mismo flujo que ProjectPhaseCoverEditor: preview → subida → guardado ligero. */
export function BrandKitCardCoverField({
  card,
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

  const savedCover = cardPreviewImage(card);
  const displayUrl = localPreview || savedCover || "";
  const hasCover = Boolean(displayUrl);

  useEffect(() => {
    onUploadActivityChange?.(uploading);
  }, [uploading, onUploadActivityChange]);

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || uploading) return;

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
      const mime = resolveBrandAssetMime(file) ?? file.type ?? "image/jpeg";
      const url =
        mime.startsWith("image/") && mime !== "image/svg+xml"
          ? await uploadPhaseCoverImageFile(file, (event) => setUploadProgress(event))
          : (await uploadBrandAssetFile(file)).url;

      setUploadProgress({ loaded: file.size, total: file.size, percentage: 95, phase: "save" });

      const coverFile: BrandKitAssetFile = {
        id: createBrandKitId(),
        url,
        fileName: file.name,
        mime,
      };
      const nextCard = setCardCoverFiles(card, [coverFile]);
      const ok = await onSaveCover(nextCard);
      if (!ok) {
        setUploadError("No se pudo guardar la portada en Brand ID.");
        setLocalPreview(null);
        onPreviewChange?.(null);
        return;
      }

      setLocalPreview(null);
      onPreviewChange?.(null);
    } catch (e) {
      setLocalPreview(null);
      onPreviewChange?.(null);
      setUploadError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleRemove() {
    if (uploading) return;
    setUploading(true);
    setUploadProgress({ loaded: 0, total: 1, percentage: 95, phase: "save" });
    try {
      const ok = await onSaveCover(setCardCoverFiles(card, []));
      if (!ok) {
        window.alert("No se pudo quitar la portada.");
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
              : "Es lo que se ve en el grid y en el portal del cliente. Reemplazala cuando cambies de proyecto."}
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
          <span className="text-[10px]" style={{ color: brandUi.textFaint }}>
            Sin portada — se usa la paleta de colores si hay
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

      <label
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium border ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
      >
        {uploading ? "Subiendo…" : hasCover ? "Cambiar imagen" : "Subir imagen de portada"}
        <input
          type="file"
          accept="image/*,.svg"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            void handleFile(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
