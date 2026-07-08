"use client";

import { useEffect, useState } from "react";
import { uploadAdminImageFile } from "@/lib/admin-client-upload";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

async function maybeCompressForUpload(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;

  const dataUrl = await fileToDataUrl(file);
  const img = new window.Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo procesar la imagen para compresión."));
    img.src = dataUrl;
  });

  const maxDim = 2400;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const qualities = [0.86, 0.8, 0.74, 0.68, 0.62];
  for (const q of qualities) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", q),
    );
    if (!blob) continue;
    if (blob.size <= maxBytes) {
      const base = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    }
  }
  return file;
}

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
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

export function ImageField({ label, value, onChange, helpText, minWidth, minHeight, ratio }: Props) {
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const MAX_UPLOAD_MB = 4;
  const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
  const previewSrc = localPreview || value?.trim() || "";

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type="url"
        value={value}
        onChange={(e) => {
          if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
          setLocalPreview(null);
          onChange(e.target.value);
        }}
        placeholder="https://… o sube un archivo"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          {(minWidth || minHeight || ratio) ? " " : ""}
          {[minWidth ? `Mín: ${minWidth}px ancho` : "", minHeight ? `Mín: ${minHeight}px alto` : "", ratio ? `Proporción sugerida: ${ratio}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setErr(null);
            setInfo(null);
            setLoading(true);
            try {
              const uploadCandidate = await maybeCompressForUpload(f, MAX_UPLOAD_BYTES);
              if (uploadCandidate.size > MAX_UPLOAD_BYTES) {
                setErr(`Archivo demasiado pesado para Vercel (máx. recomendado ${MAX_UPLOAD_MB}MB).`);
                return;
              }
              if (uploadCandidate !== f) {
                setInfo(`Imagen optimizada automáticamente (${(uploadCandidate.size / 1024 / 1024).toFixed(2)}MB).`);
              }
              if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
              setLocalPreview(URL.createObjectURL(uploadCandidate));
              const dims = await checkImageConstraints(uploadCandidate, minWidth, minHeight);
              if (!dims.ok) {
                setErr(dims.error);
                return;
              }
              const url = await uploadAdminImageFile(uploadCandidate, { minWidth, minHeight });
              if (localPreview?.startsWith("blob:")) URL.revokeObjectURL(localPreview);
              setLocalPreview(null);
              onChange(url);
            } catch (x) {
              setErr(x instanceof Error ? x.message : "Error");
            } finally {
              setLoading(false);
            }
          }}
        />
        {loading && <span className="text-xs text-neutral-500">Subiendo…</span>}
      </div>
      {info && <p className="text-xs text-emerald-700">{info}</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
