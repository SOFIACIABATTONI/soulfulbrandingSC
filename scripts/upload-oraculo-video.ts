/**
 * Sube el video de presentación de Oráculo Raíz a Vercel Blob.
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

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

  if (!token && !(storeId && oidcToken)) {
    console.error(
      "Faltan credenciales Blob.\n" +
        "Opción A: vercel env pull .env.production.local --environment production --yes\n" +
        "Opción B: BLOB_READ_WRITE_TOKEN en .env",
    );
    process.exit(1);
  }

  const buffer = await readFile(SOURCE);
  console.log(`Subiendo ${(buffer.length / 1024 / 1024).toFixed(1)} MB…`);

  const blob = await put("oraculo/presentacion.mov", buffer, {
    access: "public",
    ...(token ? { token } : { storeId: storeId!, oidcToken: oidcToken! }),
    contentType: "video/quicktime",
    multipart: true,
  });

  console.log("\n✓ Video subido:");
  console.log(blob.url);
  console.log("\nAgregá en Vercel (Production + Preview):");
  console.log(`NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL=${blob.url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
