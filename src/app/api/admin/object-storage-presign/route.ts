import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth-api";
import {
  blobStorageDiagnostics,
  resolveAdminUploadConstraints,
  type AdminUploadKind,
} from "@/lib/admin-blob-upload";
import { storageUploadErrorMessage } from "@/lib/admin-upload-put";
import { createR2PresignedPut, hasR2Configured } from "@/lib/object-storage";

export const runtime = "nodejs";

const bodySchema = z.object({
  pathname: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
  clientPayload: z.string().optional(),
  kind: z.enum(["brand", "manual", "image"]).optional(),
});

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!hasR2Configured()) {
    return NextResponse.json({ error: "R2 no configurado en este entorno." }, { status: 503 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const kind: AdminUploadKind = parsed.kind ?? "brand";

  try {
    const constraints = resolveAdminUploadConstraints(
      parsed.pathname,
      parsed.clientPayload ?? null,
      kind,
    );
    if (parsed.contentLength > constraints.maximumSizeInBytes) {
      return NextResponse.json({ error: "El archivo supera el tamaño máximo permitido." }, { status: 400 });
    }
    if (!constraints.allowedContentTypes.includes(parsed.contentType)) {
      return NextResponse.json({ error: "Tipo de contenido no permitido." }, { status: 400 });
    }

    const presigned = await createR2PresignedPut(
      parsed.pathname,
      parsed.contentType,
      parsed.contentLength,
    );
    return NextResponse.json(presigned);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida.";
    console.error("[api/admin/object-storage-presign] failed", error, blobStorageDiagnostics());
    return NextResponse.json({ error: storageUploadErrorMessage(message) }, { status: 400 });
  }
}
