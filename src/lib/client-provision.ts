import type { Lead, Quote } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeQuoteContent } from "@/lib/quote-types";

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

function projectTitleFromLead(lead: Pick<Lead, "name" | "company" | "service">): string {
  const service = SERVICE_LABELS[lead.service] ?? lead.service;
  const company = lead.company.trim();
  if (company) return `${service} — ${company}`;
  return `${service} — ${lead.name.trim()}`;
}

/**
 * Tras aprobar presupuesto: crea Client + ClientProject si no existen.
 * Idempotente — no duplica si ya hay cliente/proyecto vinculado al lead.
 */
export async function provisionClientFromApprovedQuote(
  lead: Lead,
  quote: Quote,
): Promise<{ clientId: string; projectId: string; created: boolean }> {
  const content = normalizeQuoteContent(quote.content);
  const value = content.total ?? lead.estimatedValue ?? 0;

  const existingClient = await prisma.client.findUnique({
    where: { leadId: lead.id },
    include: { projects: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (existingClient) {
    if (existingClient.projects[0]) {
      return {
        clientId: existingClient.id,
        projectId: existingClient.projects[0].id,
        created: false,
      };
    }
    const project = await prisma.clientProject.create({
      data: {
        clientId: existingClient.id,
        title: projectTitleFromLead(lead),
        service: lead.service,
        value: value > 0 ? value : 1,
        status: "onboarding",
      },
    });
    return { clientId: existingClient.id, projectId: project.id, created: true };
  }

  const [client, project] = await prisma.$transaction(async (tx) => {
    const c = await tx.client.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        leadId: lead.id,
      },
    });
    const p = await tx.clientProject.create({
      data: {
        clientId: c.id,
        title: projectTitleFromLead(lead),
        service: lead.service,
        value: value > 0 ? value : 1,
        status: "onboarding",
      },
    });
    await tx.lead.update({
      where: { id: lead.id },
      data: { status: "ganado" },
    });
    return [c, p] as const;
  });

  return { clientId: client.id, projectId: project.id, created: true };
}

/**
 * Garantiza ficha de cliente para un lead con presupuesto aprobado (o ganado).
 * Idempotente — repara leads históricos sin Client vinculado.
 */
export async function ensureClientForLead(leadId: string): Promise<string | null> {
  const existing = await prisma.client.findUnique({ where: { leadId } });
  if (existing) return existing.id;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return null;

  const orphanByEmail = await prisma.client.findFirst({
    where: { email: lead.email, leadId: null },
  });
  if (orphanByEmail) {
    await prisma.client.update({
      where: { id: orphanByEmail.id },
      data: { leadId: lead.id },
    });
    return orphanByEmail.id;
  }

  const approvedQuote = await prisma.quote.findFirst({
    where: { leadId, status: "aprobado" },
    orderBy: { respondedAt: "desc" },
  });
  if (approvedQuote) {
    const { clientId } = await provisionClientFromApprovedQuote(lead, approvedQuote);
    return clientId;
  }

  if (lead.status === "ganado") {
    const client = await prisma.client.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        leadId: lead.id,
      },
    });
    return client.id;
  }

  return null;
}
