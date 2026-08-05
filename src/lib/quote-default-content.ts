import type { Lead } from "@prisma/client";
import type { QuoteContent } from "@/lib/quote-types";
import { buildPresupuestoMarkdown } from "@/lib/quote-templates";
import {
  buildQuoteContentForProposal,
  defaultProposalIdForLead,
} from "@/lib/quote-proposal-templates";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

/** Deck visual Born & Be (12 JPG) — plantilla por defecto al crear presupuesto. */
export function buildBornAndBeDeckContent(
  lead: Pick<Lead, "name" | "estimatedValue">,
): QuoteContent {
  return {
    format: "bbb-deck-2026",
    body: `Propuesta Born & Be — Soulful Branding® para ${lead.name.trim()}`,
    ...(lead.estimatedValue != null
      ? { total: lead.estimatedValue, currency: "EUR" as const }
      : {}),
  };
}

/** Carta markdown (alternativa editable). */
export function buildMarkdownQuoteContent(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): QuoteContent {
  return {
    format: "markdown",
    body: buildPresupuestoMarkdown(lead),
    total: lead.estimatedValue ?? undefined,
    currency: lead.estimatedValue != null ? "EUR" : undefined,
  };
}

export function buildDefaultQuoteContent(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): QuoteContent {
  return buildQuoteContentForProposal(defaultProposalIdForLead(lead), lead);
}
