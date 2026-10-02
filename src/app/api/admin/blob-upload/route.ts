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
  blobClientUploadUnavailableMessage,
  blobStorageDiagnostics,
  resolveAdminUploadConstraints,
  resolveBlobSignedTokenAuth,
} from "@/lib/admin-blob-upload";
import { hasR2Configured } from "@/lib/object-storage";

export const runtime = "nodejs";

function resolveUploadConstraints(pathname: string, clientPayload: string | null) {
  return resolveAdminUploadConstraints(pathname, clientPayload, "brand");
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
    if (hasR2Configured()) {
      return NextResponse.json(
        {
          error:
            "Este entorno usa Cloudflare R2. Actualizá la página del admin (subida presignada R2).",
        },
        { status: 400 },
      );
    }

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
