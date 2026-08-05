import { NextResponse } from "next/server";
import path from "path";
import { put } from "@vercel/blob";
import { imageSize } from "image-size";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobStorageDiagnostics,
  blobStorageErrorMessage,
  hasBlobCredentials,
  resolveBlobPutOptions,
} from "@/lib/admin-blob-upload";
import { savePublicDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_DIM = 8000;

/** Imágenes del portfolio público — URL accesible sin login (grilla /portfolio). */
export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 8MB" }, { status: 400 });
    }

    const meta = imageSize(buf);
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w > MAX_DIM || h > MAX_DIM) {
      return NextResponse.json({ error: "Imagen demasiado grande (máx. 8000px por lado)." }, { status: 400 });
    }

    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const blobPath = `uploads/${name}`;

    const onVercel = process.env.VERCEL === "1";
    const useBlob = onVercel || hasBlobCredentials();
    if (useBlob) {
      try {
        const blob = await put(
          blobPath,
          buf,
          await resolveBlobPutOptions({
            access: "public",
            contentType: file.type || "application/octet-stream",
          }),
        );
        return NextResponse.json({ url: blob.url });
      } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        console.error("[portfolio-image-upload] blob put failed", cause, blobStorageDiagnostics());
        if (onVercel) {
          return NextResponse.json({ error: blobStorageErrorMessage(cause) }, { status: 500 });
        }
      }
    }

    const url = await savePublicDevUpload("portfolio", name, buf);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[portfolio-image-upload] failed", error);
    return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 500 });
  }
}
