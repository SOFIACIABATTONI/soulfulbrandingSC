import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from "pdf-lib";
import type { ContractAcceptanceRecord } from "@/lib/contract-acceptance";
import { stripHtmlToPlainText } from "@/lib/contract-acceptance";
import { embedSoLogoFuchsia, SO_LOGO_PDF_WIDTH } from "@/lib/invoice-logo.server";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const LINE_HEIGHT = 14;
const BODY_SIZE = 10;
const TITLE_SIZE = 20;
const HEADING_SIZE = 12;
const FUCHSIA = rgb(240 / 255, 49 / 255, 114 / 255);
const TEXT = rgb(19 / 255, 25 / 255, 69 / 255);
const TEXT_MUTED = rgb(0.45, 0.48, 0.55);
const PAGE_BG = rgb(242 / 255, 242 / 255, 242 / 255);
const HASH_BG = rgb(1, 247 / 255, 250 / 255);
const WHITE = rgb(1, 1, 1);

type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function wrapText(
  text: string,
  maxWidth: number,
  font: PdfFont,
  size: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      if (current) {
        lines.push(current);
        current = "";
      }
      let chunk = "";
      for (const char of word) {
        const nextChunk = `${chunk}${char}`;
        if (font.widthOfTextAtSize(nextChunk, size) <= maxWidth) {
          chunk = nextChunk;
        } else {
          if (chunk) lines.push(chunk);
          chunk = char;
        }
      }
      current = chunk;
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type PdfWriter = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PdfFont;
  bold: PdfFont;
  logo: PDFImage | null;
  pageNumber: number;
};

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  font: PdfFont,
  size: number,
  color: ReturnType<typeof rgb>,
): void {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawLogo(
  page: PDFPage,
  logo: PDFImage | null,
  bold: PdfFont,
  centerX: number,
  topY: number,
  width = SO_LOGO_PDF_WIDTH,
): number {
  if (logo) {
    const height = (logo.height / logo.width) * width;
    page.drawImage(logo, {
      x: centerX - width / 2,
      y: topY - height,
      width,
      height,
    });
    return topY - height;
  }

  const size = width * 0.62;
  const fallback = "SÓ";
  const textWidth = bold.widthOfTextAtSize(fallback, size);
  page.drawText(fallback, {
    x: centerX - textWidth / 2,
    y: topY - size,
    size,
    font: bold,
    color: FUCHSIA,
  });
  return topY - size;
}

function decorateContractPage(writer: PdfWriter): void {
  writer.page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_WIDTH - 56,
    height: PAGE_HEIGHT - 56,
    color: WHITE,
    borderColor: FUCHSIA,
    borderWidth: 1.25,
  });
  drawLogo(writer.page, writer.logo, writer.bold, 66, PAGE_HEIGHT - 43, 28);
  writer.page.drawText("Soulful Branding®", {
    x: 88,
    y: PAGE_HEIGHT - 58,
    size: 9,
    font: writer.bold,
    color: TEXT,
  });
  writer.page.drawText(`Contrato aceptado · página ${writer.pageNumber}`, {
    x: PAGE_WIDTH - 190,
    y: PAGE_HEIGHT - 58,
    size: 8.5,
    font: writer.regular,
    color: TEXT_MUTED,
  });
}

function ensureSpace(writer: PdfWriter, needed: number): void {
  if (writer.y - needed >= MARGIN) return;
  writer.page = writer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  writer.pageNumber += 1;
  decorateContractPage(writer);
  writer.y = PAGE_HEIGHT - 94;
}

function drawLines(
  writer: PdfWriter,
  lines: string[],
  opts?: { size?: number; bold?: boolean; gap?: number },
): void {
  const size = opts?.size ?? BODY_SIZE;
  const font = opts?.bold ? writer.bold : writer.regular;
  const gap = opts?.gap ?? LINE_HEIGHT;

  for (const line of lines) {
    ensureSpace(writer, gap);
    writer.page.drawText(line, {
      x: MARGIN,
      y: writer.y,
      size,
      font,
      color: TEXT,
    });
    writer.y -= gap;
  }
}

function drawDetail(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  regular: PdfFont,
  bold: PdfFont,
  maxWidth: number,
): number {
  page.drawText(label, {
    x: 102,
    y,
    size: 9.5,
    font: bold,
    color: TEXT,
  });

  const labelWidth = bold.widthOfTextAtSize(label, 9.5);
  const valueX = 102 + labelWidth + 7;
  const valueWidth = maxWidth - labelWidth - 7;
  const lines = wrapText(value, valueWidth, regular, 9.5);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: index === 0 ? valueX : 102,
      y: y - index * 13,
      size: 9.5,
      font: regular,
      color: TEXT_MUTED,
    });
  });
  return y - Math.max(20, lines.length * 13 + 7);
}

async function drawCertificatePage(
  doc: PDFDocument,
  record: ContractAcceptanceRecord,
  regular: PdfFont,
  bold: PdfFont,
  logo: PDFImage | null,
  acceptedLocal: string,
): Promise<void> {
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: PAGE_BG,
  });

  const cardX = 70;
  const cardY = 58;
  const cardWidth = PAGE_WIDTH - cardX * 2;
  const cardHeight = PAGE_HEIGHT - cardY * 2;
  page.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: WHITE,
    borderColor: FUCHSIA,
    borderWidth: 2,
  });

  const cardTop = cardY + cardHeight;
  const logoBottom = drawLogo(page, logo, bold, PAGE_WIDTH / 2, cardTop - 34, 58);
  drawCenteredText(page, "Certificado de aceptación", logoBottom - 31, bold, TITLE_SIZE, TEXT);
  drawCenteredText(
    page,
    "Registro electrónico del contrato",
    logoBottom - 49,
    regular,
    10,
    TEXT_MUTED,
  );

  page.drawLine({
    start: { x: 102, y: logoBottom - 69 },
    end: { x: PAGE_WIDTH - 102, y: logoBottom - 69 },
    thickness: 1,
    color: FUCHSIA,
    opacity: 0.35,
  });

  const detailWidth = PAGE_WIDTH - 204;
  let y = logoBottom - 94;
  y = drawDetail(page, "Proyecto:", record.project.title, y, regular, bold, detailWidth);
  y = drawDetail(
    page,
    "Cliente:",
    `${record.client.name}${record.client.company ? ` · ${record.client.company}` : ""}`,
    y,
    regular,
    bold,
    detailWidth,
  );
  y = drawDetail(page, "Email:", record.clientEmail, y, regular, bold, detailWidth);
  y = drawDetail(page, "Nombre declarado:", record.typedName, y, regular, bold, detailWidth);
  y = drawDetail(page, "Fecha:", `${acceptedLocal} (ART)`, y, regular, bold, detailWidth);
  y = drawDetail(page, "Servicio:", record.project.service, y, regular, bold, detailWidth);
  y = drawDetail(
    page,
    "Inversión:",
    `EUR ${record.project.value.toLocaleString("en-US")}`,
    y,
    regular,
    bold,
    detailWidth,
  );
  y = drawDetail(
    page,
    "Dirección IP:",
    record.ipAddress || "No registrada",
    y,
    regular,
    bold,
    detailWidth,
  );
  y = drawDetail(
    page,
    "Navegador:",
    record.userAgent || "No registrado",
    y,
    regular,
    bold,
    detailWidth,
  );

  const statementLines = wrapText(
    "La persona identificada confirmó haber leído y aceptado el contrato mediante el enlace único enviado a su correo electrónico.",
    detailWidth,
    regular,
    9,
  );
  y -= 3;
  statementLines.forEach((line) => {
    page.drawText(line, {
      x: 102,
      y,
      size: 9,
      font: regular,
      color: TEXT_MUTED,
    });
    y -= 13;
  });

  const hashLines = wrapText(record.contentHash, detailWidth - 28, regular, 8.5);
  const hashHeight = 43 + hashLines.length * 12;
  const hashY = Math.max(cardY + 78, y - hashHeight - 10);
  page.drawRectangle({
    x: 94,
    y: hashY,
    width: PAGE_WIDTH - 188,
    height: hashHeight,
    color: HASH_BG,
    borderColor: FUCHSIA,
    borderWidth: 0.8,
    opacity: 0.95,
  });
  page.drawText("HUELLA DIGITAL SHA-256", {
    x: 108,
    y: hashY + hashHeight - 20,
    size: 8.5,
    font: bold,
    color: FUCHSIA,
  });
  hashLines.forEach((line, index) => {
    page.drawText(line, {
      x: 108,
      y: hashY + hashHeight - 39 - index * 12,
      size: 8.5,
      font: regular,
      color: TEXT,
    });
  });

  drawCenteredText(page, "Soulful Branding®", cardY + 35, bold, 9, TEXT);
  drawCenteredText(page, "sofiaciabattoni.com", cardY + 21, regular, 8.5, TEXT_MUTED);
}

export async function buildContractAcceptancePdf(
  record: ContractAcceptanceRecord,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedSoLogoFuchsia(doc);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const acceptedLocal = record.acceptedAt.toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  await drawCertificatePage(doc, record, regular, bold, logo, acceptedLocal);

  const contractPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const writer: PdfWriter = {
    doc,
    page: contractPage,
    y: PAGE_HEIGHT - 94,
    regular,
    bold,
    logo,
    pageNumber: 2,
  };
  decorateContractPage(writer);

  drawLines(writer, ["Texto del contrato aceptado"], {
    size: HEADING_SIZE,
    bold: true,
    gap: 24,
  });

  const contractPlain = stripHtmlToPlainText(record.contractHtml);
  const contractLines = contractPlain.split("\n").flatMap((paragraph) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return [""];
    return wrapText(trimmed, maxWidth, regular, BODY_SIZE);
  });

  for (const line of contractLines) {
    if (!line) {
      writer.y -= 6;
      continue;
    }
    drawLines(writer, [line]);
  }

  return doc.save();
}

export function acceptancePdfFilename(projectTitle: string): string {
  const safe = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `contrato-aceptado-${safe || "proyecto"}.pdf`;
}
