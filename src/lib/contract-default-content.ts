import type { Client } from "@prisma/client";
import { normalizeContractContent, type ContractContent } from "@/lib/contract-types";

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

export type ContractProjectInput = {
  title: string;
  service: string;
  value: number;
  contractContent?: unknown;
  client: Pick<Client, "name" | "company" | "email">;
};

export function buildDefaultContractContent(project: ContractProjectInput): ContractContent {
  const serviceLabel = SERVICE_LABELS[project.service] ?? project.service;
  const company = project.client.company.trim();
  const clientLine = company
    ? `${project.client.name} (${company})`
    : project.client.name;

  const body = [
    `# Contrato de prestación de servicios`,
    ``,
    `**Prestador:** Sofía Ciabattoni — Soulful Branding®`,
    `**Cliente:** ${clientLine}`,
    `**Email:** ${project.client.email}`,
    ``,
    `## Objeto`,
    ``,
    `El presente contrato regula la prestación del servicio de **${serviceLabel}** para el proyecto *${project.title}*.`,
    ``,
    `## Alcance y entregables`,
    ``,
    `- Desarrollo estratégico y creativo según propuesta aprobada.`,
    `- Entregables definidos en el presupuesto y fases del proyecto.`,
    `- Revisiones incluidas según lo acordado en la propuesta.`,
    ``,
    `## Inversión`,
    ``,
    `**Total:** USD ${project.value.toLocaleString("en-US")}`,
    ``,
    `**Forma de pago:** 50% seña al firmar + 50% contra entrega final (salvo acuerdo distinto por escrito).`,
    ``,
    `## Plazos`,
    ``,
    `Los plazos estimados se coordinarán al inicio del proyecto. El cliente se compromete a entregar feedback en un plazo razonable para no demorar la producción.`,
    ``,
    `## Propiedad intelectual`,
    ``,
    `Tras el pago total, los derechos de uso de la identidad entregada pasan al cliente, salvo elementos de terceros o licencias específicas indicadas por escrito.`,
    ``,
    `## Aceptación`,
    ``,
    `Al aceptar este contrato mediante el enlace enviado, el cliente confirma haber leído y estar de acuerdo con estos términos.`,
  ].join("\n");

  return { body, format: "markdown" };
}

export function resolveContractContent(
  project: ContractProjectInput,
): ContractContent {
  const stored = normalizeContractContent(project.contractContent);
  if (stored.body.trim()) return stored;
  return buildDefaultContractContent(project);
}
