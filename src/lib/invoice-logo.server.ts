import "server-only";
import fs from "fs";
import path from "path";
import type { PDFDocument } from "pdf-lib";
import { SO_LOGO_EMAIL_CID } from "@/lib/brand-so-logo";

const PNG_CANDIDATES = [
  "public/brand/sc-so-logo-fuchsia.png",
  "assets/brand/logos/logoclaro.png",
];

export { SO_LOGO_EMAIL_CID };

/** PNG del logo SÓ para incrustar en PDFs (si existe en disco). */
export async function embedSoLogoFuchsia(
  doc: PDFDocument,
): Promise<Awaited<ReturnType<PDFDocument["embedPng"]>> | null> {
  for (const rel of PNG_CANDIDATES) {
    const filePath = path.join(process.cwd(), rel);
    if (!fs.existsSync(filePath)) continue;
    try {
      const bytes = fs.readFileSync(filePath);
      return await doc.embedPng(bytes);
    } catch {
      continue;
    }
  }
  return null;
}

export const SO_LOGO_PDF_WIDTH = 52;

/** PNG del logo SÓ en disco — para adjunto inline en mails. */
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

/** Adjunto inline reutilizable para que el logo nunca dependa de una URL externa. */
export function soLogoEmailAttachments() {
  const bytes = readSoLogoFuchsiaPngBytes();
  return bytes
    ? [
        {
          filename: "sc-so-logo-fuchsia.png",
          content: bytes.toString("base64"),
          contentId: SO_LOGO_EMAIL_CID,
        },
      ]
    : [];
}
