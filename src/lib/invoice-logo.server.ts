import "server-only";
import fs from "fs";
import path from "path";
import type { PDFDocument } from "pdf-lib";
import { SO_LOGO_EMAIL_CID, soLogoFuchsiaUrl } from "@/lib/brand-so-logo";

const PNG_CANDIDATES = [
  "public/brand/sc-so-logo-fuchsia.png",
  "assets/brand/logos/logoclaro.png",
];

export { SO_LOGO_EMAIL_CID };

/** Lectura directa desde disco — funciona en local; en Vercel `public/` no siempre
 * queda incluido en el bundle de la función serverless (file tracing no lo detecta
 * porque la ruta se arma dinámicamente), así que puede fallar en producción. */
export function readSoLogoFuchsiaPngBytes(): Buffer | null {
  for (const rel of PNG_CANDIDATES) {
    const filePath = path.join(process.cwd(), rel);
    if (!fs.existsSync(filePath)) continue;
    try {
      return fs.readFileSync(filePath);
    } catch {
      continue;
    }
  }
  return null;
}

let cachedLogoBytes: Buffer | null | undefined;

/** Resuelve los bytes del logo: primero desde disco y, si no está disponible
 * (típico en Vercel), por HTTP desde la URL pública — que siempre funciona
 * porque Next.js sirve `public/` de forma estática vía CDN. */
export async function resolveSoLogoFuchsiaPngBytes(): Promise<Buffer | null> {
  if (cachedLogoBytes !== undefined) return cachedLogoBytes;

  const fromDisk = readSoLogoFuchsiaPngBytes();
  if (fromDisk) {
    cachedLogoBytes = fromDisk;
    return fromDisk;
  }

  try {
    const res = await fetch(soLogoFuchsiaUrl());
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      cachedLogoBytes = buf;
      return buf;
    }
    console.error("[invoice-logo] fetch del logo falló", res.status);
  } catch (error) {
    console.error("[invoice-logo] fetch del logo falló", error);
  }

  cachedLogoBytes = null;
  return null;
}

export const SO_LOGO_PDF_WIDTH = 52;

/** PNG del logo SÓ para incrustar en PDFs. */
export async function embedSoLogoFuchsia(
  doc: PDFDocument,
): Promise<Awaited<ReturnType<PDFDocument["embedPng"]>> | null> {
  const bytes = await resolveSoLogoFuchsiaPngBytes();
  if (!bytes) return null;
  try {
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

/** Adjunto inline reutilizable para que el logo nunca dependa de una URL externa. */
export async function soLogoEmailAttachments() {
  const bytes = await resolveSoLogoFuchsiaPngBytes();
  return bytes
    ? [
        {
          filename: "sc-so-logo-fuchsia.png",
          content: bytes.toString("base64"),
          contentType: "image/png",
          contentId: SO_LOGO_EMAIL_CID,
        },
      ]
    : [];
}
