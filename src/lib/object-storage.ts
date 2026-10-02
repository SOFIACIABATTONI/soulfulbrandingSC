import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function hasR2Configured(): boolean {
  return Boolean(
    env("R2_ACCOUNT_ID") &&
      env("R2_ACCESS_KEY_ID") &&
      env("R2_SECRET_ACCESS_KEY") &&
      env("R2_BUCKET_NAME") &&
      env("R2_PUBLIC_BASE_URL"),
  );
}

export function normalizeObjectKey(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Ruta de objeto inválida.");
  }
  return normalized;
}

export function publicUrlForKey(key: string): string {
  const base = env("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  const parts = normalizeObjectKey(key)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `${base}/${parts.join("/")}`;
}

function getR2Client(): S3Client {
  const accountId = env("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export async function putR2Object(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!hasR2Configured()) {
    throw new Error("R2 no configurado.");
  }
  const objectKey = normalizeObjectKey(key);
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env("R2_BUCKET_NAME"),
      Key: objectKey,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    }),
  );
  return publicUrlForKey(objectKey);
}

export type R2PresignedPut = {
  uploadUrl: string;
  publicUrl: string;
  requiredHeaders: Record<string, string>;
};

export async function createR2PresignedPut(
  key: string,
  contentType: string,
  contentLength: number,
): Promise<R2PresignedPut> {
  if (!hasR2Configured()) {
    throw new Error("R2 no configurado.");
  }
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    throw new Error("Tamaño de archivo inválido.");
  }
  const objectKey = normalizeObjectKey(key);
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env("R2_BUCKET_NAME"),
    Key: objectKey,
    ContentType: contentType || "application/octet-stream",
    ContentLength: contentLength,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  return {
    uploadUrl,
    publicUrl: publicUrlForKey(objectKey),
    requiredHeaders: {
      "Content-Type": contentType || "application/octet-stream",
    },
  };
}
