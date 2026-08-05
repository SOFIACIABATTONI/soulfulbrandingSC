import type { QuoteProposalId } from "@/lib/quote-types";

/** PDFs en public/quotes/pdfs/ — nombres de archivo sin “ticket” (el cliente puede ver la URL). */
export const QUOTE_PROPOSAL_PDF_PATHS: Partial<Record<QuoteProposalId, string>> = {
  "estrategia-visual": "/quotes/pdfs/soul-brand-map.pdf",
  "diseno-editorial": "/quotes/pdfs/bbb-identidad-de-marca.pdf",
};

export function getQuoteProposalPdfPath(proposalId: QuoteProposalId): string {
  return QUOTE_PROPOSAL_PDF_PATHS[proposalId] ?? "";
}

const LEGACY_PDF_URL_MAP: Record<string, string> = {
  "/quotes/pdfs/soul-brand-map-low-ticket.pdf": "/quotes/pdfs/soul-brand-map.pdf",
  "/quotes/pdfs/bbb-identidad-marca-mid-ticket.pdf": "/quotes/pdfs/bbb-identidad-de-marca.pdf",
  "/quotes/pdfs/bbb-born-and-be-high-ticket.pdf": "/quotes/pdfs/bbb-identidad-de-marca.pdf",
};

/** Borradores guardados antes del rename de archivos PDF. */
export function normalizeLegacyProposalPdfUrl(pdfUrl: string | undefined): string | undefined {
  const trimmed = pdfUrl?.trim();
  if (!trimmed) return undefined;
  return LEGACY_PDF_URL_MAP[trimmed] ?? trimmed;
}

export function isQuotePdfFormat(format: string | undefined): boolean {
  return format === "pdf";
}
