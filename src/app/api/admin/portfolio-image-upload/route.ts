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
  resolveBrandAssetMime,
} from "@/lib/admin-blob-upload";
import { savePublicDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const ALLOWED = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 48 * 1024 * 1024;
const MAX_DIM = 8000;

/** Imágenes y videos del portfolio público — URL accesible sin login. */
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

    const resolvedMime = (resolveBrandAssetMime(file) ?? file.type ?? "").trim();
    const isVideoFile =
      VIDEO_TYPES.has(resolvedMime) || /\.(mp4|webm)$/i.test(file.name);
    if (!isVideoFile && (!resolvedMime || !IMAGE_TYPES.has(resolvedMime))) {
      return NextResponse.json(
        { error: "Tipo no permitido. Usá JPG, PNG, WEBP, GIF, SVG, MP4 o WebM." },
        { status: 400 },
      );
    }
    if (isVideoFile && resolvedMime && !VIDEO_TYPES.has(resolvedMime)) {
      return NextResponse.json(
        { error: "Tipo de video no permitido. Usá MP4 o WebM." },
        { status: 400 },
      );
    }

    const maxBytes = isVideoFile ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > maxBytes) {
      return NextResponse.json(
        { error: isVideoFile ? "Máximo 48MB para video." : "Máximo 8MB para imagen." },
        { status: 400 },
      );
    }

    if (!isVideoFile) {
      try {
        const meta = imageSize(buf);
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        if (w > MAX_DIM || h > MAX_DIM) {
          return NextResponse.json(
            { error: "Imagen demasiado grande (máx. 8000px por lado)." },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json({ error: "No se pudo leer la imagen." }, { status: 400 });
      }
    }

    const ext =
      path.extname(file.name) ||
      (resolvedMime === "image/png"
        ? ".png"
        : resolvedMime === "image/svg+xml"
          ? ".svg"
        : resolvedMime === "video/mp4"
          ? ".mp4"
          : resolvedMime === "video/webm"
            ? ".webm"
            : ".jpg");
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
            contentType: resolvedMime || "application/octet-stream",
          }),
        );
        return NextResponse.json({ url: blob.url, mime: resolvedMime });
      } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        console.error("[portfolio-image-upload] blob put failed", cause, blobStorageDiagnostics());
        if (onVercel) {
          return NextResponse.json({ error: blobStorageErrorMessage(cause) }, { status: 500 });
        }
      }
    }

    const url = await savePublicDevUpload("portfolio", name, buf);
    return NextResponse.json({ url, mime: resolvedMime });
  } catch (error) {
    console.error("[portfolio-image-upload] failed", error);
    return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 500 });
  }
}
