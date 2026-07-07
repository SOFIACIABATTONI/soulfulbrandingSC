import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/auth-api";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const BRAND_ASSET_TYPES = new Set([
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

function resolveBrandAssetMime(file: File): string | null {
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

function extFromMime(mime: string, originalName: string): string {
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

const MAX_BYTES = 20 * 1024 * 1024;

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
    if (file.size > MAX_BYTES) {
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
    const ext = extFromMime(resolvedMime, file.name) || ".bin";
    const safeBase = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(0, 60);
    const name = `brand/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBase || "asset"}${ext}`;

    const onVercel = process.env.VERCEL === "1";
    if (onVercel) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) {
        return NextResponse.json(
          { error: "Falta configurar BLOB_READ_WRITE_TOKEN en Vercel." },
          { status: 500 },
        );
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
    console.error("[api/admin/brand-asset-upload] failed", error);
    return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 500 });
  }
}
