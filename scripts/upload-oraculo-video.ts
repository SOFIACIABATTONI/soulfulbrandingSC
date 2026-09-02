/**
 * Sube el video de presentación de Oráculo Raíz a Vercel Blob.
 *
 * Uso:
 *   npx tsx scripts/upload-oraculo-video.ts
 *
 * Requiere BLOB_READ_WRITE_TOKEN en .env
 * Luego agregar en Vercel la URL impresa como:
 *   NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL
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

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error("Falta BLOB_READ_WRITE_TOKEN en .env");
    process.exit(1);
  }

  const buffer = await readFile(SOURCE);
  console.log(`Subiendo ${(buffer.length / 1024 / 1024).toFixed(1)} MB…`);

  const blob = await put("oraculo/presentacion.mov", buffer, {
    access: "public",
    token,
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
