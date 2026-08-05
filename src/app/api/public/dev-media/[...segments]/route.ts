import { NextResponse } from "next/server";
import { readLocalDevUpload } from "@/lib/local-dev-upload-store";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ segments: string[] }> };

/** Sirve imágenes públicas subidas en dev (sin login). En Vercel se usa Blob. */
export async function GET(_req: Request, ctx: RouteParams) {
  if (process.env.VERCEL === "1") {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
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

  const ext = file.fileName.includes(".") ? file.fileName.slice(file.fileName.lastIndexOf(".")).toLowerCase() : "";
  const contentType = mimeFromExt(ext);

  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}
