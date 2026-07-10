"use client";

import { uploadPresigned } from "@vercel/blob/client";
import {
  ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
  ADMIN_IMAGE_MAX_BYTES,
  BRAND_ASSET_ALLOWED_CONTENT_TYPES,
  BRAND_ASSET_MAX_BYTES,
  buildAdminImagePathname,
  buildBrandAssetPathname,
  buildManualPdfPathname,
  blobClientUploadUnavailableMessage,
  isLocalAdminUploadHost,
  isPdfFile,
  MANUAL_PDF_MAX_BYTES,
  resolveBrandAssetMime,
  VERCEL_SERVER_UPLOAD_MAX_BYTES,
} from "@/lib/admin-blob-upload";

const BLOB_UPLOAD_URL = "/api/admin/blob-upload";
const LARGE_UPLOAD_HINT =
  "Si el archivo pesa más de 4 MB, se sube directo a Blob. Verificá que el store esté conectado al proyecto en Vercel (Preview + Production).";

type UploadPayload = {
  kind: "brand" | "manual" | "image";
  fileName: string;
  mime: string;
};

export type UploadProgressEvent = {
  loaded: number;
  total: number;
  percentage: number;
  phase: "upload" | "save";
};

async function postFormUpload(
  endpoint: string,
  file: File,
  extra?: Record<string, string>,
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<{ url: string; fileName?: string; mime?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const ratio = event.total > 0 ? event.loaded / event.total : 0;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percentage: Math.min(88, Math.round(ratio * 88)),
        phase: "upload",
      });
    };

    xhr.onload = () => {
      const raw = xhr.responseText ?? "";
      let j: { url?: string; fileName?: string; mime?: string; error?: string } = {};
      try {
        if (raw) j = JSON.parse(raw) as typeof j;
      } catch {
        j = {};
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const fallback =
          xhr.status === 413
            ? "El archivo es demasiado grande para subir por el servidor. Probá de nuevo; en Vercel usamos subida directa a Blob."
            : `Error al subir (HTTP ${xhr.status}).`;
        reject(new Error(j?.error || fallback));
        return;
      }
      if (!j.url) {
        reject(new Error(j.error ?? "Respuesta inválida del servidor al subir."));
        return;
      }
      resolve({ url: j.url, fileName: j.fileName, mime: j.mime, error: j.error });
    };

    xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
    xhr.onabort = () => reject(new Error("Subida cancelada."));

    const fd = new FormData();
    fd.set("file", file);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) fd.set(key, value);
    }
    xhr.send(fd);
  });
}

async function uploadViaBlobClient(
  pathname: string,
  file: File,
  payload: UploadPayload,
  opts?: { multipart?: boolean; contentType?: string; onProgress?: (event: UploadProgressEvent) => void },
): Promise<{ url: string; fileName: string; mime: string }> {
  try {
    const blob = await uploadPresigned(pathname, file, {
      access: "public",
      handleUploadUrl: BLOB_UPLOAD_URL,
      clientPayload: JSON.stringify(payload),
      contentType: opts?.contentType ?? payload.mime,
      multipart: opts?.multipart ?? file.size > 20 * 1024 * 1024,
      onUploadProgress: opts?.onProgress
        ? (progress) => {
            opts.onProgress?.({
              loaded: progress.loaded,
              total: progress.total,
              percentage: Math.min(88, Math.round(progress.percentage * 0.88)),
              phase: "upload",
            });
          }
        : undefined,
    });
    return { url: blob.url, fileName: payload.fileName, mime: payload.mime };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    if (raw.includes("HTTP 500") || raw.includes("Failed to retrieve")) {
      throw new Error(`${blobClientUploadUnavailableMessage()} ${LARGE_UPLOAD_HINT}`);
    }
    throw error;
  }
}

async function compressImageForServerUpload(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;
  const mime = resolveBrandAssetMime(file);
  if (!mime || !ADMIN_IMAGE_ALLOWED_CONTENT_TYPES.includes(mime)) return file;
  if (mime === "image/svg+xml" || mime === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    let maxDim = 2560;
    let quality = 0.88;
    const outputMime = mime === "image/png" ? "image/jpeg" : mime;

    for (let attempt = 0; attempt < 10; attempt++) {
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputMime, quality);
      });
      if (!blob) break;
      if (blob.size <= maxBytes) {
        const base = file.name.replace(/\.[^.]+$/, "");
        const ext = outputMime === "image/jpeg" ? ".jpg" : outputMime === "image/webp" ? ".webp" : ".png";
        return new File([blob], `${base}${ext}`, { type: outputMime });
      }

      if (quality > 0.55) {
        quality -= 0.08;
      } else {
        maxDim = Math.round(maxDim * 0.8);
        quality = 0.82;
      }
    }

    throw new Error(
      `No se pudo optimizar la imagen por debajo de ${Math.round(maxBytes / (1024 * 1024))} MB. ${LARGE_UPLOAD_HINT}`,
    );
  } finally {
    bitmap.close();
  }
}

async function prepareFileForVercelUpload(file: File): Promise<File> {
  if (useLocalFilesystemUpload() || useServerBlobUpload(file)) return file;
  return compressImageForServerUpload(file, VERCEL_SERVER_UPLOAD_MAX_BYTES);
}

function useLocalFilesystemUpload(): boolean {
  if (typeof window === "undefined") return false;
  return isLocalAdminUploadHost(window.location.hostname);
}

/** En Vercel, archivos chicos van por API (OIDC); los grandes requieren client upload + read-write token. */
function useServerBlobUpload(file: File): boolean {
  if (typeof window === "undefined") return false;
  if (useLocalFilesystemUpload()) return true;
  return file.size <= VERCEL_SERVER_UPLOAD_MAX_BYTES;
}

export async function uploadBrandAssetFile(
  file: File,
): Promise<{ url: string; fileName: string; mime: string }> {
  const prepared = await prepareFileForVercelUpload(file);
  const mime = resolveBrandAssetMime(prepared);
  if (!mime) {
    throw new Error("Tipo no permitido. Usá imagen, PDF, ZIP o fuente (.woff, .woff2, .otf, .ttf).");
  }
  if (prepared.size > BRAND_ASSET_MAX_BYTES) {
    throw new Error("Máximo 20MB por archivo.");
  }

  if (useServerBlobUpload(prepared)) {
    const j = await postFormUpload("/api/admin/brand-asset-upload", prepared);
    return { url: j.url, fileName: j.fileName ?? prepared.name, mime: j.mime ?? mime };
  }

  const pathname = buildBrandAssetPathname(prepared.name, mime);
  return uploadViaBlobClient(
    pathname,
    prepared,
    { kind: "brand", fileName: prepared.name, mime },
    { contentType: mime },
  );
}

export async function uploadManualPdfFile(
  file: File,
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<{ url: string; fileName: string; mime: string }> {
  if (!isPdfFile(file)) throw new Error("Subí un archivo PDF.");
  if (file.size > MANUAL_PDF_MAX_BYTES) {
    throw new Error(`Máximo ${Math.round(MANUAL_PDF_MAX_BYTES / (1024 * 1024))} MB por manual.`);
  }

  onProgress?.({ loaded: 0, total: file.size, percentage: 2, phase: "upload" });

  let result: { url: string; fileName: string; mime: string };
  if (useServerBlobUpload(file)) {
    const j = await postFormUpload("/api/admin/manual-pdf-upload", file, undefined, onProgress);
    result = { url: j.url, fileName: j.fileName ?? file.name, mime: j.mime ?? "application/pdf" };
  } else {
    const pathname = buildManualPdfPathname(file.name);
    result = await uploadViaBlobClient(
      pathname,
      file,
      { kind: "manual", fileName: file.name, mime: "application/pdf" },
      { contentType: "application/pdf", multipart: file.size > 8 * 1024 * 1024, onProgress },
    );
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 92, phase: "save" });
  return result;
}

export async function uploadAdminImageFile(
  file: File,
  opts?: { minWidth?: number; minHeight?: number },
): Promise<string> {
  const prepared = await prepareFileForVercelUpload(file);
  const mime = resolveBrandAssetMime(prepared);
  if (!mime || !ADMIN_IMAGE_ALLOWED_CONTENT_TYPES.includes(mime)) {
    throw new Error("Tipo no permitido.");
  }
  if (prepared.size > ADMIN_IMAGE_MAX_BYTES) {
    throw new Error("Máximo 8MB");
  }

  if (useServerBlobUpload(prepared)) {
    const extra: Record<string, string> = {};
    if (opts?.minWidth) extra.minWidth = String(opts.minWidth);
    if (opts?.minHeight) extra.minHeight = String(opts.minHeight);
    const j = await postFormUpload("/api/upload", prepared, extra);
    return j.url;
  }

  const pathname = buildAdminImagePathname(prepared.name, mime);
  const uploaded = await uploadViaBlobClient(
    pathname,
    prepared,
    { kind: "image", fileName: prepared.name, mime },
    { contentType: mime },
  );
  return uploaded.url;
}

/** Tipos permitidos expuestos para validación en UI si hace falta. */
export { BRAND_ASSET_ALLOWED_CONTENT_TYPES, ADMIN_IMAGE_ALLOWED_CONTENT_TYPES };
