import { NextResponse } from "next/server";
import path from "path";
import { imageSize } from "image-size";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobStorageDiagnostics,
  resolveBrandAssetMime,
} from "@/lib/admin-blob-upload";
import {
  NoRemoteStorageError,
  putPublicFile,
  shouldUseRemoteStorage,
  storageUploadErrorMessage,
} from "@/lib/admin-upload-put";
import { savePublicDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const AUDIO_TYPES = new Set(["audio/mp4", "audio/mpeg", "audio/mp3", "audio/x-m4a", "audio/m4a"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 48 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_DIM = 8000;

/** Imágenes, audio y video para el CMS de Oráculo Raíz. */
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
      VIDEO_TYPES.has(resolvedMime) || /\.(mp4|webm|mov)$/i.test(file.name);
    const isAudioFile =
      AUDIO_TYPES.has(resolvedMime) || /\.(m4a|mp3|mpeg)$/i.test(file.name);

    if (isVideoFile) {
      if (resolvedMime && !VIDEO_TYPES.has(resolvedMime) && !/\.mov$/i.test(file.name)) {
        return NextResponse.json({ error: "Video: usá MP4, WebM o MOV." }, { status: 400 });
      }
    } else if (isAudioFile) {
      if (resolvedMime && !AUDIO_TYPES.has(resolvedMime) && !/\.m4a$/i.test(file.name)) {
        return NextResponse.json({ error: "Audio: usá M4A o MP3." }, { status: 400 });
      }
    } else if (!resolvedMime || !IMAGE_TYPES.has(resolvedMime)) {
      return NextResponse.json(
        { error: "Tipo no permitido. Imagen (JPG, PNG, WEBP, GIF), audio (M4A, MP3) o video (MP4)." },
        { status: 400 },
      );
    }

    const maxBytes = isVideoFile ? MAX_VIDEO_BYTES : isAudioFile ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > maxBytes) {
      return NextResponse.json({ error: `Archivo demasiado grande (máx. ${maxBytes / (1024 * 1024)} MB).` }, { status: 400 });
    }

    if (!isVideoFile && !isAudioFile) {
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
        : resolvedMime === "video/mp4"
          ? ".mp4"
          : resolvedMime === "audio/mpeg"
            ? ".mp3"
            : ".jpg");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const blobPath = `oraculo/cms/${name}`;

    const onVercel = process.env.VERCEL === "1";
    if (shouldUseRemoteStorage()) {
      try {
        const uploaded = await putPublicFile(blobPath, buf, resolvedMime || "application/octet-stream");
        return NextResponse.json({ url: uploaded.url, mime: resolvedMime });
      } catch (error) {
        if (error instanceof NoRemoteStorageError) {
          /* local fallback */
        } else {
          const cause = error instanceof Error ? error.message : String(error);
          console.error("[oraculo-media-upload] remote put failed", cause, blobStorageDiagnostics());
          if (onVercel) {
            return NextResponse.json({ error: storageUploadErrorMessage(cause) }, { status: 500 });
          }
        }
      }
    }

    const url = await savePublicDevUpload("oraculo-cms", name, buf);
    return NextResponse.json({ url, mime: resolvedMime });
  } catch (error) {
    console.error("[oraculo-media-upload] failed", error);
    return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 500 });
  }
}
