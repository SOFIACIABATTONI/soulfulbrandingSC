import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { getInvoiceDocumentTitle } from "@/lib/invoice-utils";
import { embedSoLogoFuchsia, SO_LOGO_PDF_WIDTH } from "@/lib/invoice-logo.server";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const FUCHSIA = rgb(240 / 255, 49 / 255, 114 / 255);
const PAGE_BG = rgb(242 / 255, 242 / 255, 242 / 255);
const TEXT = rgb(19 / 255, 25 / 255, 69 / 255);
const TEXT_MUTED = rgb(0.45, 0.48, 0.55);
const WHITE = rgb(1, 1, 1);

const CARD_WIDTH = 360;
const CARD_PAD_X = 28;
const CARD_PAD_TOP = 44;
const CARD_PAD_BOTTOM = 28;
const LOGO_SIZE = 34;
const BODY_SIZE = 10.5;
const LINE_HEIGHT = 15;
const SITE_LABEL = "sofiaciabattoni.com";

export type InvoicePdfRecord = {
  number: string;
  type: "sena" | "final";
  total: number;
  status: string;
  issuedAt: Date;
  paidAt: Date | null;
  notes: string;
  client: { name: string; company: string };
  project: { title: string; value?: number } | null;
};

type PdfFont = Awaited<ReturnType<PDFDocument["embedFont"]>>;

type ContentBlock = {
  text: string;
  font: "regular" | "bold";
  size: number;
  color: "text" | "muted" | "accent";
  lineGap?: number;
  gapBefore?: number;
};

function formatMoney(amount: number): string {
  return `EUR ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    dateStyle: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function wrapText(text: string, maxWidth: number, font: PdfFont, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function colorFor(kind: ContentBlock["color"]) {
  if (kind === "accent") return FUCHSIA;
  if (kind === "muted") return TEXT_MUTED;
  return TEXT;
}

function buildContentBlocks(record: InvoicePdfRecord): ContentBlock[] {
  const projectTitle = record.project?.title ?? "tu proyecto";
  const isSena = record.type === "sena";
  const blocks: ContentBlock[] = [
    {
      text: isSena
        ? "Con este pago registramos la seña acordada y damos inicio al proceso de trabajo."
        : "Con este pago registramos el saldo final del proyecto.",
      font: "regular",
      size: BODY_SIZE,
      color: "muted",
      gapBefore: 18,
    },
    {
      text: isSena
        ? `Recibo de seña para el proyecto ${projectTitle}.`
        : `Factura final para el proyecto ${projectTitle}.`,
      font: "regular",
      size: BODY_SIZE,
      color: "text",
      gapBefore: 10,
    },
    {
      text: `Monto: ${formatMoney(record.total)}`,
      font: "bold",
      size: BODY_SIZE,
      color: "text",
      gapBefore: 8,
    },
    {
      text: `Cliente: ${record.client.name}`,
      font: "regular",
      size: 9.5,
      color: "muted",
      lineGap: 13,
      gapBefore: 6,
    },
    {
      text: `Nº ${record.number} · ${formatDate(record.paidAt ?? record.issuedAt)}`,
      font: "regular",
      size: 9.5,
      color: "muted",
      lineGap: 13,
    },
  ];

  if (record.status === "pagado") {
    blocks.push({
      text: "Estado: Pagado",
      font: "bold",
      size: 9.5,
      color: "accent",
      gapBefore: 6,
    });
  }

  if (record.notes.trim()) {
    blocks.push({
      text: `Notas: ${record.notes.trim()}`,
      font: "regular",
      size: 9,
      color: "muted",
      lineGap: 12,
      gapBefore: 8,
    });
  }

  blocks.push({
    text: "Documento personal y confidencial.",
    font: "regular",
    size: 8.5,
    color: "muted",
    gapBefore: 14,
  });

  return blocks;
}

function measureContentHeight(
  blocks: ContentBlock[],
  innerWidth: number,
  regular: PdfFont,
  bold: PdfFont,
): number {
  let height = CARD_PAD_TOP + LOGO_SIZE + 10;

  for (const block of blocks) {
    height += block.gapBefore ?? 0;
    const font = block.font === "bold" ? bold : regular;
    const lines = wrapText(block.text, innerWidth, font, block.size);
    height += lines.length * (block.lineGap ?? LINE_HEIGHT);
  }

  height += CARD_PAD_BOTTOM;
  return height;
}

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

function drawContentBlocks(
  page: PDFPage,
  blocks: ContentBlock[],
  innerX: number,
  innerWidth: number,
  startY: number,
  regular: PdfFont,
  bold: PdfFont,
): void {
  let y = startY;

  for (const block of blocks) {
    y -= block.gapBefore ?? 0;
    const font = block.font === "bold" ? bold : regular;
    const lines = wrapText(block.text, innerWidth, font, block.size);
    for (const line of lines) {
      page.drawText(line, {
        x: innerX,
        y,
        size: block.size,
        font,
        color: colorFor(block.color),
      });
      y -= block.lineGap ?? LINE_HEIGHT;
    }
  }
}

async function buildBrandedCardPdf(record: InvoicePdfRecord): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: PAGE_BG,
  });

  const blocks = buildContentBlocks(record);
  const innerWidth = CARD_WIDTH - CARD_PAD_X * 2;
  const cardHeight = measureContentHeight(blocks, innerWidth, regular, bold);
  const cardX = (PAGE_WIDTH - CARD_WIDTH) / 2;
  const cardTop = (PAGE_HEIGHT + cardHeight) / 2;
  const cardBottom = cardTop - cardHeight;

  page.drawRectangle({
    x: cardX,
    y: cardBottom,
    width: CARD_WIDTH,
    height: cardHeight,
    color: WHITE,
    borderColor: FUCHSIA,
    borderWidth: 2,
  });

  const innerX = cardX + CARD_PAD_X;
  let contentStartY = cardTop - CARD_PAD_TOP - LOGO_SIZE;

  const logoPng = await embedSoLogoFuchsia(doc);
  if (logoPng) {
    const logoHeight = (logoPng.height / logoPng.width) * SO_LOGO_PDF_WIDTH;
    const logoX = (PAGE_WIDTH - SO_LOGO_PDF_WIDTH) / 2;
    const logoY = cardTop - CARD_PAD_TOP - logoHeight;
    page.drawImage(logoPng, {
      x: logoX,
      y: logoY,
      width: SO_LOGO_PDF_WIDTH,
      height: logoHeight,
    });
    contentStartY = logoY - 14;
  } else {
    const logoY = cardTop - CARD_PAD_TOP - LOGO_SIZE;
    drawCenteredText(page, "SÓ", logoY, bold, LOGO_SIZE, FUCHSIA);
    contentStartY = logoY - 10;
  }

  drawContentBlocks(page, blocks, innerX, innerWidth, contentStartY, regular, bold);

  const footerY = cardBottom - 28;
  drawCenteredText(page, "Soulful Branding®", footerY + 10, bold, 9, TEXT);
  drawCenteredText(page, SITE_LABEL, footerY, regular, 8.5, TEXT_MUTED);

  return doc.save();
}

export async function buildInvoicePdf(record: InvoicePdfRecord): Promise<Uint8Array> {
  return buildBrandedCardPdf(record);
}

export function invoicePdfFilename(record: Pick<InvoicePdfRecord, "type" | "number">): string {
  const prefix = record.type === "sena" ? "recibo-sena" : "factura-final";
  const safeNum = record.number.replace(/[^a-zA-Z0-9-]+/g, "-");
  return `${prefix}-${safeNum}.pdf`;
}

export function invoiceDocumentTitle(record: Pick<InvoicePdfRecord, "type">): string {
  return getInvoiceDocumentTitle(record.type);
}
