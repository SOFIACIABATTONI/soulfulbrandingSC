import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { imageSize } from "image-size";
import { isAdminRequest } from "@/lib/auth-api";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_DIM = 8000;

function parsePositiveInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const minWidth = parsePositiveInt(form.get("minWidth"));
  const minHeight = parsePositiveInt(form.get("minHeight"));
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
  const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf);
  const url = `/uploads/${name}`;
  return NextResponse.json({ url });
}
