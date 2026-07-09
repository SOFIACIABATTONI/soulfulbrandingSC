import path from "path";

export const BRAND_ASSET_MAX_BYTES = 20 * 1024 * 1024;
export const MANUAL_PDF_MAX_BYTES = 150 * 1024 * 1024;
export const ADMIN_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export const BRAND_ASSET_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
  "font/sfnt",
  "font/collection",
  "application/font-sfnt",
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/x-font-truetype",
  "application/x-font-opentype",
  "application/vnd.ms-fontobject",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".ttc": "font/collection",
};

function extFromName(originalName: string): string {
  return path.extname(originalName).toLowerCase();
}

export function resolveBrandAssetMime(file: Pick<File, "name" | "type">): string | null {
  const ext = extFromName(file.name);
  const fromExt = ext ? EXT_TO_MIME[ext] : undefined;

  const rawType = (file.type ?? "").trim().toLowerCase();
  if (rawType && rawType !== "application/octet-stream") {
    if (BRAND_ASSET_TYPES.has(rawType)) return rawType;
    if (fromExt) return fromExt;
    return null;
  }

  return fromExt ?? null;
}

export function extFromMime(mime: string, originalName: string): string {
  const fromName = extFromName(originalName);
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "application/x-zip-compressed": ".zip",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "font/ttf": ".ttf",
    "font/otf": ".otf",
    "font/sfnt": ".ttf",
    "font/collection": ".ttc",
    "application/vnd.ms-fontobject": ".eot",
  };
  return map[mime] ?? "";
}

export function safeUploadBaseName(originalName: string): string {
  return path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 60);
}

export function buildBrandAssetPathname(originalName: string, mime: string): string {
  const ext = extFromMime(mime, originalName) || ".bin";
  const safeBase = safeUploadBaseName(originalName);
  return `brand/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBase || "asset"}${ext}`;
}

export function buildManualPdfPathname(originalName: string): string {
  const safeBase = safeUploadBaseName(originalName);
  return `manual/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBase || "manual"}.pdf`;
}

export function buildAdminImagePathname(originalName: string, mime: string): string {
  const ext = extFromMime(mime, originalName) || (mime === "image/png" ? ".png" : ".jpg");
  return `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export function isPdfFile(file: Pick<File, "name" | "type">): boolean {
  const mime = (file.type ?? "").trim().toLowerCase();
  if (mime === "application/pdf") return true;
  if (mime === "application/x-google-chrome-pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export function assertAllowedBlobPrefix(pathname: string, allowedPrefixes: readonly string[]): void {
  const normalized = pathname.replace(/\\/g, "/");
  if (normalized.includes("..") || normalized.startsWith("/")) {
    throw new Error("Ruta de archivo inválida.");
  }
  if (!allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error("Ruta de archivo no permitida.");
  }
}

/** Límite seguro bajo el tope de ~4.5 MB del body en funciones de Vercel. */
export const VERCEL_SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export function hasBlobReadWriteToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function hasBlobStoreConnected(): boolean {
  return Boolean(process.env.BLOB_STORE_ID?.trim());
}

/** OIDC en runtime: el SDK resuelve el token; no hace falta leer VERCEL_OIDC_TOKEN acá. */
export function hasBlobOidcAuth(): boolean {
  return process.env.VERCEL === "1" && hasBlobStoreConnected();
}

export function hasBlobCredentials(): boolean {
  return hasBlobReadWriteToken() || hasBlobOidcAuth();
}

export type BlobPutExtra = {
  access: "public";
  contentType: string;
  multipart?: boolean;
};

export function blobPutOptions(extra: BlobPutExtra): BlobPutExtra & {
  token?: string;
  storeId?: string;
} {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (token) return { ...extra, token };
  if (storeId) return { ...extra, storeId };
  return extra;
}

export function blobStorageDiagnostics(): string {
  const parts = [
    `vercel=${process.env.VERCEL === "1" ? "sí" : "no"}`,
    `BLOB_STORE_ID=${hasBlobStoreConnected() ? "sí" : "no"}`,
    `BLOB_READ_WRITE_TOKEN=${hasBlobReadWriteToken() ? "sí" : "no"}`,
  ];
  return parts.join(", ");
}

export function blobStorageErrorMessage(cause?: string): string {
  const detail = cause?.trim();
  if (hasBlobReadWriteToken() || hasBlobStoreConnected()) {
    return detail
      ? `No se pudo subir a Blob (${detail}). Reintentá o agregá BLOB_READ_WRITE_TOKEN en Vercel y redeploy.`
      : "No se pudo subir a Blob. Reintentá o agregá BLOB_READ_WRITE_TOKEN en Vercel y redeploy.";
  }
  return (
    "Falta conectar Blob al proyecto en Vercel (Storage → Blob → Connect, Preview + Production). " +
    "Para subidas desde el navegador, copiá el Read-Write Token en Ajustes del store y agregalo como BLOB_READ_WRITE_TOKEN."
  );
}

export function blobTokenMissingMessage(): string {
  return blobStorageErrorMessage();
}

export function isLocalAdminUploadHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/** URLs guardadas en dev local (/uploads/...) no existen en Vercel hasta volver a subir. */
export function isLocalDevUploadUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith("/uploads/");
}

export const BRAND_ASSET_ALLOWED_CONTENT_TYPES = Array.from(BRAND_ASSET_TYPES);
export const ADMIN_IMAGE_ALLOWED_CONTENT_TYPES = Array.from(IMAGE_TYPES);
