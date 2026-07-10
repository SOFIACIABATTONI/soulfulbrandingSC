import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { isAdminRequest } from "@/lib/auth-api";
import {
  ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
  ADMIN_IMAGE_MAX_BYTES,
  assertAllowedBlobPrefix,
  blobClientUploadUnavailableMessage,
  blobStorageDiagnostics,
  BRAND_ASSET_ALLOWED_CONTENT_TYPES,
  BRAND_ASSET_MAX_BYTES,
  MANUAL_PDF_MAX_BYTES,
  resolveBlobSignedTokenAuth,
} from "@/lib/admin-blob-upload";

export const runtime = "nodejs";

type ClientPayload = {
  kind?: "brand" | "manual" | "image";
  fileName?: string;
  mime?: string;
};

type UploadConstraints = {
  allowedPrefixes: readonly string[];
  maximumSizeInBytes: number;
  allowedContentTypes: string[];
};

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ClientPayload;
  } catch {
    return {};
  }
}

function constraintsForKind(kind: ClientPayload["kind"]): UploadConstraints {
  if (kind === "manual") {
    return {
      allowedPrefixes: ["manual/"],
      maximumSizeInBytes: MANUAL_PDF_MAX_BYTES,
      allowedContentTypes: ["application/pdf", "application/x-google-chrome-pdf"],
    };
  }
  if (kind === "image") {
    return {
      allowedPrefixes: ["uploads/"],
      maximumSizeInBytes: ADMIN_IMAGE_MAX_BYTES,
      allowedContentTypes: ADMIN_IMAGE_ALLOWED_CONTENT_TYPES,
    };
  }
  return {
    allowedPrefixes: ["brand/"],
    maximumSizeInBytes: BRAND_ASSET_MAX_BYTES,
    allowedContentTypes: BRAND_ASSET_ALLOWED_CONTENT_TYPES,
  };
}

function resolveUploadConstraints(pathname: string, clientPayload: string | null): UploadConstraints {
  const payload = parseClientPayload(clientPayload);
  const kind = payload.kind ?? "brand";
  const constraints = constraintsForKind(kind);
  assertAllowedBlobPrefix(pathname, constraints.allowedPrefixes);
  return constraints;
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: HandleUploadBody | HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadBody | HandleUploadPresignedBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  try {
    if (body.type === "blob.generate-presigned-url") {
      const auth = await resolveBlobSignedTokenAuth();
      if (!auth.token && !auth.storeId) {
        console.error("[api/admin/blob-upload] presigned auth missing", blobStorageDiagnostics());
        return NextResponse.json({ error: blobClientUploadUnavailableMessage() }, { status: 500 });
      }

      const jsonResponse = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname, clientPayload) => {
          const constraints = resolveUploadConstraints(pathname, clientPayload);
          const signed = await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: constraints.allowedContentTypes,
            maximumSizeInBytes: constraints.maximumSizeInBytes,
            ...auth,
          });
          return {
            token: signed,
            urlOptions: {
              addRandomSuffix: false,
              allowedContentTypes: constraints.allowedContentTypes,
              maximumSizeInBytes: constraints.maximumSizeInBytes,
              tokenPayload: clientPayload,
            },
          };
        },
        onUploadCompleted: async () => {
          // Persistencia del URL la hace el cliente al guardar fase / Brand ID.
        },
      });

      return NextResponse.json(jsonResponse);
    }

    if (body.type === "blob.generate-client-token") {
      if (!readWriteToken) {
        return NextResponse.json(
          {
            error:
              "Subida legacy sin token. Actualizá la página e intentá de nuevo (usamos subida presignada con OIDC).",
          },
          { status: 400 },
        );
      }

      const jsonResponse = await handleUpload({
        body,
        request,
        token: readWriteToken,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const constraints = resolveUploadConstraints(pathname, clientPayload);
          return {
            maximumSizeInBytes: constraints.maximumSizeInBytes,
            allowedContentTypes: constraints.allowedContentTypes,
            addRandomSuffix: false,
            tokenPayload: clientPayload,
          };
        },
        onUploadCompleted: async () => {},
      });

      return NextResponse.json(jsonResponse);
    }

    if (body.type === "blob.upload-completed") {
      if (readWriteToken) {
        const jsonResponse = await handleUpload({
          body,
          request,
          token: readWriteToken,
          onBeforeGenerateToken: async () => ({ addRandomSuffix: false }),
          onUploadCompleted: async () => {},
        });
        return NextResponse.json(jsonResponse);
      }

      const jsonResponse = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname, clientPayload) => {
          const auth = await resolveBlobSignedTokenAuth();
          const constraints = resolveUploadConstraints(pathname, clientPayload);
          const signed = await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: constraints.allowedContentTypes,
            maximumSizeInBytes: constraints.maximumSizeInBytes,
            ...auth,
          });
          return { token: signed };
        },
        onUploadCompleted: async () => {},
      });
      return NextResponse.json(jsonResponse);
    }

    return NextResponse.json({ error: "Evento de subida no reconocido." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo preparar la subida.";
    console.error("[api/admin/blob-upload] failed", error, blobStorageDiagnostics());
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
