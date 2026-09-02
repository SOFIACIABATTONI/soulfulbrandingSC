import { NextResponse } from "next/server";
import path from "path";
import { put } from "@vercel/blob";
import { imageSize } from "image-size";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobStorageDiagnostics,
  blobStorageErrorMessage,
  BRAND_ASSET_MAX_BYTES,
  hasBlobCredentials,
  resolveBlobPutOptions,
  resolveBrandAssetMime,
} from "@/lib/admin-blob-upload";
import { saveLocalDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_DIM = 8000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;

function parsePositiveInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const form = await req.formData();
    const file = form.get("file");
    const minWidth = parsePositiveInt(form.get("minWidth"));
    const minHeight = parsePositiveInt(form.get("minHeight"));
    const context = form.get("context");
    const isBrandAsset = context === "brand";
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }
    const resolvedMime = resolveBrandAssetMime(file) ?? (isBrandAsset ? null : file.type || null);
    if (!resolvedMime || !ALLOWED.has(resolvedMime)) {
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const maxBytes = isBrandAsset ? BRAND_ASSET_MAX_BYTES : DEFAULT_MAX_BYTES;
    if (buf.length > maxBytes) {
      return NextResponse.json(
        { error: `Máximo ${Math.round(maxBytes / (1024 * 1024))}MB` },
        { status: 400 },
      );
    }
    if (minWidth || minHeight) {
      const meta = imageSize(buf);
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (!w || !h) {
        return NextResponse.json({ error: "No se pudo leer el tamaño de la imagen." }, { status: 400 });
      }
      if (w > MAX_DIM || h > MAX_DIM) {
        return NextResponse.json({ error: "Imagen demasiado grande (máx. 8000px por lado)." }, { status: 400 });
      }
      if (minWidth && w < minWidth) {
        return NextResponse.json({ error: `Imagen muy pequeña: mínimo ${minWidth}px de ancho.` }, { status: 400 });
      }
      if (minHeight && h < minHeight) {
        return NextResponse.json({ error: `Imagen muy pequeña: mínimo ${minHeight}px de alto.` }, { status: 400 });
      }
    }
    const ext = path.extname(file.name) || (resolvedMime === "image/png" ? ".png" : ".jpg");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const onVercel = process.env.VERCEL === "1";
    const useBlob = onVercel || hasBlobCredentials();
    if (useBlob) {
      try {
        const blob = await put(
          `uploads/${name}`,
          buf,
          await resolveBlobPutOptions({
            access: "public",
            contentType: resolvedMime || "application/octet-stream",
          }),
        );
        return NextResponse.json({ url: blob.url });
      } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        console.error("[api/upload] blob put failed", cause, blobStorageDiagnostics());
        if (onVercel) {
          return NextResponse.json({ error: blobStorageErrorMessage(cause) }, { status: 500 });
        }
        console.warn("[api/upload] blob unavailable in dev, using temp storage (outside repo)");
      }
    }

    const url = await saveLocalDevUpload("uploads", name, buf);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[api/upload] upload failed", error);
    return NextResponse.json(
      { error: "No se pudo subir la imagen en este momento. Probá con un archivo más liviano." },
      { status: 500 },
    );
  }
}
