import type { Quote } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashQuoteToken } from "@/lib/quote-token";
import {
  CLIENT_RESPONSES,
  QUOTE_EXPIRY_DAYS,
  type ClientResponse,
  type QuoteStatus,
} from "@/lib/quote-types";
import { notifyN8nQuoteEvent } from "@/lib/notify-n8n-quote";
import {
  sendQuoteResponseNotificationToAdmin,
} from "@/lib/send-quote-email";

export function isQuoteExpired(quote: Pick<Quote, "expiresAt" | "status">): boolean {
  if (quote.status === "expirado") return true;
  return new Date() > quote.expiresAt;
}

type QuoteWithLead = Quote & {
  lead: { id: string; name: string; email: string };
};

export async function expireQuoteIfNeeded(
  quote: QuoteWithLead,
): Promise<QuoteWithLead> {
  if (quote.status === "expirado" || quote.status === "borrador") return quote;
  if (!isQuoteExpired(quote)) return quote;
  return prisma.quote.update({
    where: { id: quote.id },
    data: { status: "expirado" },
    include: { lead: { select: { id: true, name: true, email: true } } },
  });
}

export async function findQuoteByPlainToken(
  token: string,
): Promise<QuoteWithLead | null> {
  const hash = hashQuoteToken(token);
  const quote = await prisma.quote.findUnique({
    where: { tokenHash: hash },
    include: { lead: { select: { id: true, name: true, email: true } } },
  });
  if (!quote) return null;
  return expireQuoteIfNeeded(quote);
}

export function quoteExpiryFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + QUOTE_EXPIRY_DAYS);
  return d;
}

const TERMINAL: QuoteStatus[] = ["aprobado", "rechazado", "consultar", "expirado"];

export async function applyClientQuoteResponse(
  quote: QuoteWithLead,
  response: ClientResponse,
  comment: string,
): Promise<Quote> {
  if (TERMINAL.includes(quote.status as QuoteStatus)) {
    return quote;
  }
  if (isQuoteExpired(quote)) {
    return prisma.quote.update({
      where: { id: quote.id },
      data: { status: "expirado" },
    });
  }

  const statusMap: Record<ClientResponse, QuoteStatus> = {
    aprobado: "aprobado",
    rechazado: "rechazado",
    consultar: "consultar",
  };
  const newStatus = statusMap[response];
  const now = new Date();

  const pipelineStep =
    response === "aprobado" ? "contrato" : response === "rechazado" ? "negociacion" : "presupuesto";

  const [updated] = await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: newStatus,
        clientResponse: response,
        clientComment: comment,
        respondedAt: now,
      },
    }),
    prisma.lead.update({
      where: { id: quote.leadId },
      data: { pipelineStep },
    }),
  ]);

  void sendQuoteResponseNotificationToAdmin({
    leadName: quote.lead.name,
    leadEmail: quote.lead.email,
    response,
    comment,
    quoteId: quote.id,
  });

  void notifyN8nQuoteEvent({
    event: "quote.responded",
    quoteId: updated.id,
    leadId: quote.lead.id,
    leadName: quote.lead.name,
    leadEmail: quote.lead.email,
    status: updated.status,
    clientResponse: response,
    clientComment: comment,
    respondedAt: now.toISOString(),
  });

  return updated;
}

export function assertClientResponse(value: string): ClientResponse | null {
  return CLIENT_RESPONSES.includes(value as ClientResponse)
    ? (value as ClientResponse)
    : null;
}

