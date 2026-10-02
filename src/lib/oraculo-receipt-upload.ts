import { hasBlobCredentials } from "@/lib/admin-blob-upload";
import {
  NoRemoteStorageError,
  putPublicFile,
  storageUploadErrorMessage,
} from "@/lib/admin-upload-put";
import { saveLocalDevUpload } from "@/lib/local-dev-upload-store";
import { hasR2Configured } from "@/lib/object-storage";

export class OraculoReceiptStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OraculoReceiptStorageError";
  }
}

/** Sube comprobante a R2 (preferido), Blob si hay token, o carpeta temp en dev local. */
export async function uploadOraculoReceipt(
  buf: Buffer,
  safeName: string,
  mime: string,
): Promise<string> {
  const objectPath = `oraculo/receipts/${Date.now()}-${safeName}`;
  const onVercel = process.env.VERCEL === "1";
  const canTryRemote = hasR2Configured() || hasBlobCredentials() || onVercel;

  if (canTryRemote) {
    try {
      const uploaded = await putPublicFile(objectPath, buf, mime);
      return uploaded.url;
    } catch (error) {
      if (onVercel) {
        const cause = error instanceof Error ? error.message : String(error);
        if (error instanceof NoRemoteStorageError || !hasR2Configured() && !hasBlobCredentials()) {
          throw new OraculoReceiptStorageError(
            "El sitio en Vercel no tiene almacenamiento configurado. Usá R2 (variables R2_*) o Vercel Blob (store conectado o BLOB_READ_WRITE_TOKEN). Ver docs/almacenamiento-r2.md.",
          );
        }
        throw new OraculoReceiptStorageError(storageUploadErrorMessage(cause));
      }
      console.warn("[oraculo-receipt] remote upload failed, using local dev store", error);
    }
  }

  if (process.env.NODE_ENV === "development") {
    return saveLocalDevUpload("oraculo-receipts", safeName, buf);
  }

  throw new OraculoReceiptStorageError(
    "Subida no disponible: configurá R2 o Blob en el entorno, o probá en local con npm run dev.",
  );
}
