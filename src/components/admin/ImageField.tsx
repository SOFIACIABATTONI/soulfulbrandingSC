"use client";

import { useEffect, useState } from "react";
import { AdminUploadProgress } from "@/components/admin/AdminUploadProgress";
import { uploadPortfolioImageFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { reloadAdminPage } from "@/lib/admin-reload";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Persiste en servidor al terminar la subida (mismo patrón que portada de etapa). */
  onSave?: (url: string) => Promise<boolean>;
  helpText?: string;
  minWidth?: number;
  minHeight?: number;
  ratio?: string;
};

function checkImageConstraints(
  file: File,
  minWidth?: number,
  minHeight?: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!minWidth && !minHeight) return Promise.resolve({ ok: true });
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      if (minWidth && w < minWidth) {
        resolve({ ok: false, error: `La imagen es muy pequeña: mínimo ${minWidth}px de ancho.` });
        return;
      }
      if (minHeight && h < minHeight) {
        resolve({ ok: false, error: `La imagen es muy pequeña: mínimo ${minHeight}px de alto.` });
        return;
      }
      resolve({ ok: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ ok: false, error: "No se pudo leer la imagen." });
    };
    img.src = objectUrl;
  });
}

export function ImageField({ label, value, onChange, onSave, helpText, minWidth, minHeight, ratio }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileSize, setUploadingFileSize] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const previewSrc = localPreview || value?.trim() || "";

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  async function handleFile(file: File) {
    setErr(null);
    setUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
    setUploadingFileName(file.name);
    setUploadingFileSize(file.size);

    const blobUrl = URL.createObjectURL(file);
    if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    setLocalPreview(blobUrl);

    try {
      const dims = await checkImageConstraints(file, minWidth, minHeight);
      if (!dims.ok) {
        setErr(dims.error);
        setLocalPreview(null);
        return;
      }

      const { url } = await uploadPortfolioImageFile(file, (event) => setUploadProgress(event));
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 95, phase: "save" });
      if (onSave) {
        const ok = await onSave(url);
        if (!ok) {
          setErr("No se pudo guardar la imagen.");
          setLocalPreview(null);
          return;
        }
      }
      onChange(url);
      reloadAdminPage({
        message: "Imagen guardada",
        detail: "Volviendo al mismo lugar del editor…",
      });
    } catch (x) {
      setLocalPreview(null);
      setErr(x instanceof Error ? x.message : "Error al subir la imagen.");
    } finally {
      URL.revokeObjectURL(blobUrl);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type="url"
        value={value}
        disabled={uploading}
        onChange={(e) => {
          if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
          setLocalPreview(null);
          onChange(e.target.value);
        }}
        placeholder="https://… o sube un archivo"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-60"
      />
      {previewSrc ? (
        <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt={`Vista previa de ${label}`}
            className="h-28 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
      {(helpText || minWidth || minHeight || ratio) && (
        <p className="text-xs text-neutral-500">
          {helpText ?? ""}
          {minWidth || minHeight || ratio ? " " : ""}
          {[minWidth ? `Mín: ${minWidth}px ancho` : "", minHeight ? `Mín: ${minHeight}px alto` : "", ratio ? `Proporción sugerida: ${ratio}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <div className="space-y-2">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? "Subiendo…" : "Seleccionar archivo"}
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {uploading && uploadProgress ? (
          <AdminUploadProgress
            fileName={uploadingFileName}
            fileSize={uploadingFileSize}
            progress={uploadProgress}
            savingLabel="Aplicando portada…"
          />
        ) : null}
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
