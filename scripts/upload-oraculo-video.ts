/**
 * Sube el video de presentación de Oráculo Raíz a R2 (o Vercel Blob si R2 no está configurado).
 *
 * Uso (OIDC, cuenta Vercel correcta):
 *   vercel login
 *   vercel link --yes
 *   vercel env pull .env.production.local --environment production --yes
 *   npx tsx scripts/upload-oraculo-video.ts
 *
 * Alternativa: BLOB_READ_WRITE_TOKEN en .env (si existe en el proyecto).
 *
 * Luego en Vercel (Production + Preview):
 *   NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL=<url impresa>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { hasR2Configured, putR2Object } from "../src/lib/object-storage";

const SOURCE = path.join(
  process.cwd(),
  "assets",
  "oraculo",
  "Oraculo-raiz-presentacion.mov",
);

async function loadEnvFile(filename: string) {
  try {
    const raw = await readFile(path.join(process.cwd(), filename), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)="(.*)"\s*$/);
      if (!m) continue;
      if (process.env[m[1]] == null || process.env[m[1]] === "") {
        process.env[m[1]] = m[2];
      }
    }
  } catch {
    // opcional
  }
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env.production.local");
  await loadEnvFile(".env");

  const buffer = await readFile(SOURCE);
  console.log(`Subiendo ${(buffer.length / 1024 / 1024).toFixed(1)} MB…`);

  const objectKey = "oraculo/presentacion.mov";
  let publicUrl: string;

  if (hasR2Configured()) {
    publicUrl = await putR2Object(objectKey, buffer, "video/quicktime");
  } else {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const storeId = process.env.BLOB_STORE_ID?.trim();
    const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

    if (!token && !(storeId && oidcToken)) {
      console.error(
        "Faltan credenciales.\n" +
          "R2: variables R2_* en .env (ver docs/almacenamiento-r2.md)\n" +
          "Blob: vercel env pull o BLOB_READ_WRITE_TOKEN",
      );
      process.exit(1);
    }

    const blob = await put(objectKey, buffer, {
      access: "public",
      ...(token ? { token } : { storeId: storeId!, oidcToken: oidcToken! }),
      contentType: "video/quicktime",
      multipart: true,
    });
    publicUrl = blob.url;
  }

  console.log("\n✓ Video subido:");
  console.log(publicUrl);
  console.log("\nAgregá en Vercel (Preview primero; Production cuando aprueben cutover):");
  console.log(`NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL=${publicUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
