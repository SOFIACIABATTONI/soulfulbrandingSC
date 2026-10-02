import { put } from "@vercel/blob";
import {
  blobStorageErrorMessage,
  hasBlobCredentials,
  resolveBlobPutOptions,
  type BlobPutExtra,
} from "@/lib/admin-blob-upload";
import { hasR2Configured, putR2Object } from "@/lib/object-storage";

export class NoRemoteStorageError extends Error {
  constructor() {
    super("NO_REMOTE_STORAGE");
    this.name = "NoRemoteStorageError";
  }
}

export type PublicUploadProvider = "r2" | "blob";

export async function putPublicFile(
  key: string,
  body: Buffer,
  contentType: string,
  options?: Pick<BlobPutExtra, "multipart">,
): Promise<{ url: string; provider: PublicUploadProvider }> {
  if (hasR2Configured()) {
    const url = await putR2Object(key, body, contentType);
    return { url, provider: "r2" };
  }

  const onVercel = process.env.VERCEL === "1";
  if (onVercel || hasBlobCredentials()) {
    const blob = await put(
      key,
      body,
      await resolveBlobPutOptions({
        access: "public",
        contentType,
        multipart: options?.multipart,
      }),
    );
    return { url: blob.url, provider: "blob" };
  }

  throw new NoRemoteStorageError();
}

export function shouldUseRemoteStorage(): boolean {
  return hasR2Configured() || process.env.VERCEL === "1" || hasBlobCredentials();
}

export function storageUploadErrorMessage(cause?: string): string {
  const detail = cause?.trim();
  if (hasR2Configured()) {
    return detail
      ? `No se pudo subir el archivo (${detail}). Revisá credenciales R2 y CORS en Cloudflare.`
      : "No se pudo subir el archivo. Revisá credenciales R2 y CORS en Cloudflare.";
  }
  return blobStorageErrorMessage(detail);
}
