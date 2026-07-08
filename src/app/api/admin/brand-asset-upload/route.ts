import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobTokenMissingMessage,
  BRAND_ASSET_MAX_BYTES,
  buildBrandAssetPathname,
  resolveBrandAssetMime,
} from "@/lib/admin-blob-upload";

export const runtime = "nodejs";

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
    if (file.size > BRAND_ASSET_MAX_BYTES) {
      return NextResponse.json({ error: "Máximo 20MB por archivo." }, { status: 400 });
    }

    const resolvedMime = resolveBrandAssetMime(file);
    if (!resolvedMime) {
      return NextResponse.json(
        { error: "Tipo no permitido. Usá imagen, PDF, ZIP o fuente (.woff, .woff2, .otf, .ttf)." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const name = buildBrandAssetPathname(file.name, resolvedMime);

    const onVercel = process.env.VERCEL === "1";
    if (onVercel) {
      const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
      if (!token) {
        return NextResponse.json({ error: blobTokenMissingMessage() }, { status: 500 });
      }
      const blob = await put(name, buf, {
        access: "public",
        contentType: resolvedMime || "application/octet-stream",
        token,
      });
      return NextResponse.json({
        url: blob.url,
        fileName: file.name,
        mime: resolvedMime,
      });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "brand");
    await mkdir(dir, { recursive: true });
    const fileName = path.basename(name);
    await writeFile(path.join(dir, fileName), buf);
    return NextResponse.json({
      url: `/uploads/brand/${fileName}`,
      fileName: file.name,
      mime: resolvedMime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir el archivo.";
    console.error("[api/admin/brand-asset-upload] failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
