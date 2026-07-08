import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminRequest } from "@/lib/auth-api";
import {
  ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
  ADMIN_IMAGE_MAX_BYTES,
  assertAllowedBlobPrefix,
  BRAND_ASSET_ALLOWED_CONTENT_TYPES,
  BRAND_ASSET_MAX_BYTES,
  MANUAL_PDF_MAX_BYTES,
} from "@/lib/admin-blob-upload";

export const runtime = "nodejs";

type ClientPayload = {
  kind?: "brand" | "manual" | "image";
  fileName?: string;
  mime?: string;
};

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ClientPayload;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Las subidas grandes desde el navegador requieren BLOB_READ_WRITE_TOKEN. Los logos e imágenes chicas (<4MB) ya pueden subirse por el servidor con OIDC.",
      },
      { status: 500 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        const payload = parseClientPayload(clientPayload);
        const kind = payload.kind ?? "brand";

        if (kind === "manual") {
          assertAllowedBlobPrefix(pathname, ["manual/"]);
          return {
            maximumSizeInBytes: MANUAL_PDF_MAX_BYTES,
            allowedContentTypes: ["application/pdf", "application/x-google-chrome-pdf"],
            addRandomSuffix: false,
            tokenPayload: clientPayload,
          };
        }

        if (kind === "image") {
          assertAllowedBlobPrefix(pathname, ["uploads/"]);
          return {
            maximumSizeInBytes: ADMIN_IMAGE_MAX_BYTES,
            allowedContentTypes: ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
            addRandomSuffix: false,
            tokenPayload: clientPayload,
          };
        }

        assertAllowedBlobPrefix(pathname, ["brand/"]);
        return {
          maximumSizeInBytes: BRAND_ASSET_MAX_BYTES,
          allowedContentTypes: BRAND_ASSET_ALLOWED_CONTENT_TYPES,
          addRandomSuffix: false,
          tokenPayload: clientPayload,
          ...(multipart ? {} : {}),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida.";
    console.error("[api/admin/blob-upload] failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
