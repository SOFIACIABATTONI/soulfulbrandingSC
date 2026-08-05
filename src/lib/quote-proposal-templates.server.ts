import "server-only";
import type { Lead } from "@prisma/client";
import type { QuoteContent, QuoteProposalId } from "@/lib/quote-types";
import { buildQuoteContentForProposal } from "@/lib/quote-proposal-templates";

/** Crea contenido de presupuesto en servidor (misma lógica que el panel admin). */
export function buildQuoteContentForProposalOnServer(
  proposalId: QuoteProposalId,
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): QuoteContent {
  return buildQuoteContentForProposal(proposalId, lead);
}
