import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/auth-api";

export const runtime = "nodejs";

/** Manuales de marca pueden ser más pesados que assets sueltos del Brand ID. */
const MAX_BYTES = 150 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  const mime = (file.type ?? "").trim().toLowerCase();
  if (mime === "application/pdf") return true;
  if (mime === "application/x-google-chrome-pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

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
    if (!isPdfFile(file)) {
      return NextResponse.json({ error: "Subí un archivo PDF." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Máximo ${Math.round(MAX_BYTES / (1024 * 1024))} MB por manual.` },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const safeBase = path
      .basename(file.name, path.extname(file.name))
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .slice(0, 60);
    const name = `manual/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBase || "manual"}.pdf`;

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
        contentType: "application/pdf",
        token,
        multipart: file.size > 20 * 1024 * 1024,
      });
      return NextResponse.json({
        url: blob.url,
        fileName: file.name,
        mime: "application/pdf",
      });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "manual");
    await mkdir(dir, { recursive: true });
    const fileName = path.basename(name);
    await writeFile(path.join(dir, fileName), buf);
    return NextResponse.json({
      url: `/uploads/manual/${fileName}`,
      fileName: file.name,
      mime: "application/pdf",
    });
  } catch (error) {
    console.error("[api/admin/manual-pdf-upload] failed", error);
    return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
  }
}
