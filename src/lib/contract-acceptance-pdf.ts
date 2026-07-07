import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ContractAcceptanceRecord } from "@/lib/contract-acceptance";
import { stripHtmlToPlainText } from "@/lib/contract-acceptance";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const LINE_HEIGHT = 14;
const BODY_SIZE = 10;
const TITLE_SIZE = 16;
const HEADING_SIZE = 12;

function wrapText(
  text: string,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
): string[] {
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
  return lines;
}

type PdfWriter = {
  doc: PDFDocument;
  page: ReturnType<PDFDocument["addPage"]>;
  y: number;
  regular: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
};

function ensureSpace(writer: PdfWriter, needed: number): void {
  if (writer.y - needed >= MARGIN) return;
  writer.page = writer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  writer.y = PAGE_HEIGHT - MARGIN;
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
      color: rgb(0.08, 0.1, 0.27),
    });
    writer.y -= gap;
  }
}

export async function buildContractAcceptancePdf(
  record: ContractAcceptanceRecord,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const writer: PdfWriter = {
    doc,
    page,
    y: PAGE_HEIGHT - MARGIN,
    regular,
    bold,
  };

  const acceptedLocal = record.acceptedAt.toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  drawLines(writer, ["Soulful Branding® — Certificado de aceptacion"], {
    size: TITLE_SIZE,
    bold: true,
    gap: 22,
  });
  drawLines(writer, [`Proyecto: ${record.project.title}`], { bold: true, gap: 18 });
  drawLines(writer, [`Generado: ${acceptedLocal} (ART)`], { gap: 20 });

  const meta = [
    `Cliente: ${record.client.name}${record.client.company ? ` (${record.client.company})` : ""}`,
    `Email registrado: ${record.clientEmail}`,
    `Nombre declarado al aceptar: ${record.typedName}`,
    `Servicio: ${record.project.service}`,
    `Inversion: USD ${record.project.value.toLocaleString("en-US")}`,
    `Direccion IP: ${record.ipAddress || "no registrada"}`,
    `Navegador: ${record.userAgent || "no registrado"}`,
    `Huella del contrato (SHA-256): ${record.contentHash}`,
  ];

  drawLines(writer, ["Registro de aceptacion electronica"], {
    size: HEADING_SIZE,
    bold: true,
    gap: 18,
  });
  for (const line of meta) {
    drawLines(writer, wrapText(line, maxWidth, regular, BODY_SIZE));
    writer.y -= 4;
  }

  writer.y -= 8;
  drawLines(
    writer,
    wrapText(
      "El cliente confirmo haber leido y aceptado el contrato mediante enlace unico enviado a su email, con consentimiento explicito y registro de fecha, hora e identificadores tecnicos.",
      maxWidth,
      regular,
      BODY_SIZE,
    ),
    { gap: LINE_HEIGHT },
  );

  writer.y -= 12;
  drawLines(writer, ["Texto del contrato aceptado"], {
    size: HEADING_SIZE,
    bold: true,
    gap: 18,
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
