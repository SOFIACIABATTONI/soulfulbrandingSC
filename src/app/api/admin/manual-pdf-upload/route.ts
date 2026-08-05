import { NextResponse } from "next/server";
import path from "path";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobStorageDiagnostics,
  blobStorageErrorMessage,
  buildManualPdfPathname,
  hasBlobCredentials,
  isPdfFile,
  MANUAL_PDF_MAX_BYTES,
  resolveBlobPutOptions,
} from "@/lib/admin-blob-upload";
import { saveLocalDevUpload } from "@/lib/local-dev-upload-store";

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
    if (!isPdfFile(file)) {
      return NextResponse.json({ error: "Subí un archivo PDF." }, { status: 400 });
    }
    if (file.size > MANUAL_PDF_MAX_BYTES) {
      return NextResponse.json(
        { error: `Máximo ${Math.round(MANUAL_PDF_MAX_BYTES / (1024 * 1024))} MB por manual.` },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const name = buildManualPdfPathname(file.name);

    const onVercel = process.env.VERCEL === "1";
    const useBlob = onVercel || hasBlobCredentials();
    if (useBlob) {
      try {
        const blob = await put(
          name,
          buf,
          await resolveBlobPutOptions({
            access: "public",
            contentType: "application/pdf",
            multipart: file.size > 20 * 1024 * 1024,
          }),
        );
        return NextResponse.json({
          url: blob.url,
          fileName: file.name,
          mime: "application/pdf",
        });
      } catch (error) {
        const cause = error instanceof Error ? error.message : String(error);
        console.error("[api/admin/manual-pdf-upload] blob put failed", cause, blobStorageDiagnostics());
        if (onVercel) {
          return NextResponse.json({ error: blobStorageErrorMessage(cause) }, { status: 500 });
        }
      }
    }

    const fileName = path.basename(name);
    const url = await saveLocalDevUpload("manual", fileName, buf);
    return NextResponse.json({
      url,
      fileName: file.name,
      mime: "application/pdf",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir el PDF.";
    console.error("[api/admin/manual-pdf-upload] failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
