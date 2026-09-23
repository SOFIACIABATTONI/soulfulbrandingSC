import { z } from "zod";
import { normalizeLegacyProposalPdfUrl } from "@/lib/quote-proposal-pdfs";

export const QUOTE_PROPOSAL_IDS = [
  "born-and-be",
  "estrategia-visual",
  "diseno-editorial",
] as const;

export type QuoteProposalId = (typeof QUOTE_PROPOSAL_IDS)[number];

export const QUOTE_STATUSES = [
  "borrador",
  "enviado",
  "visto",
  "aprobado",
  "rechazado",
  "consultar",
  "expirado",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const CLIENT_RESPONSES = ["aprobado", "rechazado", "consultar"] as const;

export type ClientResponse = (typeof CLIENT_RESPONSES)[number];

export const QUOTE_CONTENT_FORMATS = [
  "markdown",
  "plain",
  "bbb-deck-2026",
  "bbb-deck-ht-2026",
  "soul-brand-map-2026",
  "bbb-brand-2026",
  "pdf",
] as const;
export type QuoteContentFormat = (typeof QUOTE_CONTENT_FORMATS)[number];

export const quoteContentSchema = z.object({
  body: z.string().min(1).max(50000),
  format: z.enum(QUOTE_CONTENT_FORMATS).optional().default("markdown"),
  proposalId: z.enum(QUOTE_PROPOSAL_IDS).optional(),
  pdfUrl: z.preprocess(
    (v) => (typeof v === "string" && !v.trim() ? undefined : v),
    z.string().max(500).optional(),
  ),
  videoUrl: z.preprocess(
    (v) => (typeof v === "string" && !v.trim() ? undefined : v),
    z.string().url().max(500).optional(),
  ),
  total: z.number().positive().optional(),
  currency: z.string().max(8).optional(),
});

export type QuoteContent = z.infer<typeof quoteContentSchema>;

function isLegacyBrandProposalPdf(pdfUrl: string | undefined): boolean {
  const pdf = pdfUrl?.trim() ?? "";
  if (!pdf) return false;
  return (
    pdf.includes("bbb-identidad") ||
    pdf.includes("mid-ticket") ||
    pdf.includes("bbb-born-and-be")
  );
}

/** PDF o markdown placeholder → JPG Brand (BBB Low Ticket). */
export function upgradeLegacyBrandQuoteContent(content: QuoteContent): QuoteContent {
  if (content.format === "bbb-brand-2026") return content;

  const legacyPdf =
    content.format === "pdf" &&
    (content.proposalId === "diseno-editorial" || isLegacyBrandProposalPdf(content.pdfUrl));

  const legacyPlaceholder =
    content.proposalId === "diseno-editorial" &&
    content.format === "markdown" &&
    /plantilla pendiente|Identidad de Marca · BBB/i.test(content.body);

  if (!legacyPdf && !legacyPlaceholder) return content;

  const body =
    legacyPlaceholder || !content.body.trim()
      ? "Propuesta Brand — Soulful Branding®"
      : content.body;

  return {
    ...content,
    format: "bbb-brand-2026",
    proposalId: "diseno-editorial",
    pdfUrl: undefined,
    body,
  };
}

/** Acepta JSON guardado antes del campo video/format */
export function normalizeQuoteContent(raw: unknown): QuoteContent {
  if (!raw || typeof raw !== "object") {
    return { body: "", format: "markdown" };
  }
  const o = raw as Record<string, unknown>;
  const formatRaw = o.format;
  const format: QuoteContentFormat =
    formatRaw === "plain"
      ? "plain"
      : formatRaw === "bbb-deck-ht-2026"
        ? "bbb-deck-ht-2026"
        : formatRaw === "bbb-deck-2026"
          ? "bbb-deck-2026"
          : formatRaw === "soul-brand-map-2026"
            ? "soul-brand-map-2026"
            : formatRaw === "bbb-brand-2026"
              ? "bbb-brand-2026"
              : formatRaw === "pdf"
              ? "pdf"
              : "markdown";

  const pdfUrlRaw = o.pdfUrl;
  const pdfUrl = normalizeLegacyProposalPdfUrl(
    typeof pdfUrlRaw === "string" ? pdfUrlRaw : undefined,
  );

  const proposalRaw = o.proposalId;
  const proposalId =
    typeof proposalRaw === "string" &&
    QUOTE_PROPOSAL_IDS.includes(proposalRaw as (typeof QUOTE_PROPOSAL_IDS)[number])
      ? (proposalRaw as (typeof QUOTE_PROPOSAL_IDS)[number])
      : undefined;

  const parsed = quoteContentSchema.safeParse({
    body: typeof o.body === "string" ? o.body : "",
    format,
    proposalId,
    pdfUrl,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : undefined,
    total: typeof o.total === "number" ? o.total : undefined,
    currency: typeof o.currency === "string" ? o.currency : undefined,
  });
  if (parsed.success) return upgradeLegacyBrandQuoteContent(parsed.data);
  return upgradeLegacyBrandQuoteContent({
    body: typeof o.body === "string" ? o.body : "",
    format,
    proposalId,
    pdfUrl,
  });
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  visto: "Visto por cliente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  consultar: "Consulta / cambios",
  expirado: "Expirado",
};

export const CLIENT_RESPONSE_LABELS: Record<string, string> = {
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  consultar: "Quiero consultar cambios",
};

/** Días de validez del link desde el envío */
export const QUOTE_EXPIRY_DAYS = 30;
