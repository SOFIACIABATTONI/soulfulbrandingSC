import type { Lead } from "@prisma/client";
import type { QuoteContent, QuoteProposalId } from "@/lib/quote-types";
import { QUOTE_PROPOSAL_IDS } from "@/lib/quote-types";
import { buildBornAndBeDeckContent } from "@/lib/quote-default-content";
import { getQuoteProposalPdfPath } from "@/lib/quote-proposal-pdfs";

type QuoteLead = Pick<
  Lead,
  "name" | "email" | "company" | "service" | "estimatedValue" | "notes"
>;

export type QuoteProposalTemplate = {
  id: QuoteProposalId;
  label: string;
  description: string;
  /** Servicio ERP que preselecciona esta propuesta */
  serviceKey: string;
  buildContent: (lead: QuoteLead) => QuoteContent;
};

function optionalTotalFields(
  lead: Pick<Lead, "estimatedValue">,
): Pick<QuoteContent, "total" | "currency"> {
  if (lead.estimatedValue == null) return {};
  return { total: lead.estimatedValue, currency: "EUR" };
}

function buildPdfProposalContent(
  proposalId: QuoteProposalId,
  lead: Pick<Lead, "name" | "estimatedValue">,
  label: string,
): QuoteContent {
  return {
    format: "pdf",
    pdfUrl: getQuoteProposalPdfPath(proposalId),
    body: `Propuesta ${label} — Soulful Branding® para ${lead.name.trim()}`,
    proposalId,
    ...optionalTotalFields(lead),
  };
}

export const QUOTE_PROPOSAL_TEMPLATES: QuoteProposalTemplate[] = [
  {
    id: "born-and-be",
    label: "Born & Be · Brand ID",
    description: "Deck visual HT (4 diapositivas) — propuesta Born & Be actual.",
    serviceKey: "identidad-de-marca",
    buildContent: (lead) => ({
      ...buildBornAndBeDeckContent(lead),
      proposalId: "born-and-be",
    }),
  },
  {
    id: "estrategia-visual",
    label: "Soul Brand Map",
    description: "PDF — mapa estratégico de marca.",
    serviceKey: "estrategia-visual",
    buildContent: (lead) =>
      buildPdfProposalContent("estrategia-visual", lead, "Soul Brand Map"),
  },
  {
    id: "diseno-editorial",
    label: "Identidad de Marca · BBB",
    description: "PDF — propuesta de identidad de marca.",
    serviceKey: "diseno-editorial",
    buildContent: (lead) =>
      buildPdfProposalContent("diseno-editorial", lead, "Identidad de Marca · BBB"),
  },
];

export function getQuoteProposalTemplate(id: string | undefined | null): QuoteProposalTemplate {
  return (
    QUOTE_PROPOSAL_TEMPLATES.find((t) => t.id === id) ?? QUOTE_PROPOSAL_TEMPLATES[0]!
  );
}

export function resolveProposalIdFromContent(content: QuoteContent): QuoteProposalId {
  if (content.proposalId && QUOTE_PROPOSAL_IDS.includes(content.proposalId as QuoteProposalId)) {
    return content.proposalId as QuoteProposalId;
  }
  if (content.format === "bbb-deck-ht-2026" || content.format === "bbb-deck-2026") {
    return "born-and-be";
  }
  if (content.format === "pdf" && content.pdfUrl?.includes("soul-brand-map")) {
    return "estrategia-visual";
  }
  if (content.format === "pdf" && content.pdfUrl?.includes("bbb-identidad")) {
    return "diseno-editorial";
  }
  if (content.format === "pdf" && content.pdfUrl?.includes("mid-ticket")) {
    return "diseno-editorial";
  }
  if (content.format === "pdf") return "diseno-editorial";
  return "born-and-be";
}

export function defaultProposalIdForLead(
  lead: Pick<Lead, "service">,
): QuoteProposalId {
  const match = QUOTE_PROPOSAL_TEMPLATES.find((t) => t.serviceKey === lead.service);
  return match?.id ?? "born-and-be";
}

export function buildQuoteContentForProposal(
  proposalId: QuoteProposalId,
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): QuoteContent {
  return getQuoteProposalTemplate(proposalId).buildContent(lead);
}
