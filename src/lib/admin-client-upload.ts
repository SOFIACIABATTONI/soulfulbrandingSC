"use client";

import { upload as blobClientUpload } from "@vercel/blob/client";
import {
  ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
  ADMIN_IMAGE_MAX_BYTES,
  BRAND_ASSET_ALLOWED_CONTENT_TYPES,
  BRAND_ASSET_MAX_BYTES,
  buildAdminImagePathname,
  buildBrandAssetPathname,
  buildManualPdfPathname,
  isLocalAdminUploadHost,
  isPdfFile,
  MANUAL_PDF_MAX_BYTES,
  resolveBrandAssetMime,
  VERCEL_SERVER_UPLOAD_MAX_BYTES,
} from "@/lib/admin-blob-upload";

const BLOB_UPLOAD_URL = "/api/admin/blob-upload";
const LARGE_UPLOAD_TOKEN_HINT =
  "Archivos mayores a 4 MB requieren BLOB_READ_WRITE_TOKEN en Vercel (Storage → Blob → Read-Write Token → Preview + Production → redeploy).";

type UploadPayload = {
  kind: "brand" | "manual" | "image";
  fileName: string;
  mime: string;
};

async function postFormUpload(
  endpoint: string,
  file: File,
  extra?: Record<string, string>,
): Promise<{ url: string; fileName?: string; mime?: string; error?: string }> {
  const fd = new FormData();
  fd.set("file", file);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) fd.set(key, value);
  }
  const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "include" });
  const raw = await res.text();
  let j: { url?: string; fileName?: string; mime?: string; error?: string } = {};
  try {
    if (raw) j = JSON.parse(raw) as typeof j;
  } catch {
    j = {};
  }
  if (!res.ok) {
    const fallback =
      res.status === 413
        ? "El archivo es demasiado grande para subir por el servidor. Probá de nuevo; en Vercel usamos subida directa a Blob."
        : `Error al subir (HTTP ${res.status}).`;
    throw new Error(j?.error || fallback);
  }
  if (!j.url) throw new Error(j.error ?? "Respuesta inválida del servidor al subir.");
  return { url: j.url, fileName: j.fileName, mime: j.mime, error: j.error };
}

async function uploadViaBlobClient(
  pathname: string,
  file: File,
  payload: UploadPayload,
  opts?: { multipart?: boolean; contentType?: string },
): Promise<{ url: string; fileName: string; mime: string }> {
  try {
    const blob = await blobClientUpload(pathname, file, {
      access: "public",
      handleUploadUrl: BLOB_UPLOAD_URL,
      clientPayload: JSON.stringify(payload),
      contentType: opts?.contentType ?? payload.mime,
      multipart: opts?.multipart ?? file.size > 20 * 1024 * 1024,
    });
    return { url: blob.url, fileName: payload.fileName, mime: payload.mime };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    if (
      raw.includes("BLOB_READ_WRITE") ||
      raw.includes("read-write token") ||
      raw.includes("HTTP 500")
    ) {
      throw new Error(LARGE_UPLOAD_TOKEN_HINT);
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
      `No se pudo optimizar la imagen por debajo de ${Math.round(maxBytes / (1024 * 1024))} MB. ${LARGE_UPLOAD_TOKEN_HINT}`,
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
): Promise<{ url: string; fileName: string; mime: string }> {
  if (!isPdfFile(file)) throw new Error("Subí un archivo PDF.");
  if (file.size > MANUAL_PDF_MAX_BYTES) {
    throw new Error(`Máximo ${Math.round(MANUAL_PDF_MAX_BYTES / (1024 * 1024))} MB por manual.`);
  }

  if (useServerBlobUpload(file)) {
    const j = await postFormUpload("/api/admin/manual-pdf-upload", file);
    return { url: j.url, fileName: j.fileName ?? file.name, mime: j.mime ?? "application/pdf" };
  }

  const pathname = buildManualPdfPathname(file.name);
  return uploadViaBlobClient(
    pathname,
    file,
    { kind: "manual", fileName: file.name, mime: "application/pdf" },
    { contentType: "application/pdf", multipart: true },
  );
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
