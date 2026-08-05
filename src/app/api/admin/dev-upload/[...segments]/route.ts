import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { readLocalDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ segments: string[] }> };

/** Sirve uploads de dev guardados fuera del repo (solo local, admin). */
export async function GET(_req: Request, ctx: RouteParams) {
  if (process.env.VERCEL === "1") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { segments } = await ctx.params;
  if (!segments?.length || segments.length < 2) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const subdir = segments[0]!;
  const id = segments.slice(1).join("/");
  const file = await readLocalDevUpload(subdir, id);
  if (!file) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const ext = pathExt(file.fileName);
  const contentType = mimeFromExt(ext);

  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

function pathExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".zip": "application/zip",
  };
  return map[ext] ?? "application/octet-stream";
}
