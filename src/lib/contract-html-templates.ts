import type { ContractProjectInput } from "@/lib/contract-default-content";
import type { ContractContent } from "@/lib/contract-types";
import { isPhaseHtmlBody, markdownToPhaseHtml } from "@/lib/phase-html-templates";

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

export function getContractHtmlTemplate(project: ContractProjectInput): string {
  const serviceLabel = SERVICE_LABELS[project.service] ?? project.service;
  const company = project.client.company.trim();
  const clientLine = company
    ? `${project.client.name} (${company})`
    : project.client.name;

  return `<h1>Contrato de prestación de servicios</h1>
<p><strong>Prestador:</strong> Sofía Ciabattoni — Soulful Branding®</p>
<p><strong>Cliente:</strong> ${escapeHtml(clientLine)}</p>
<p><strong>Email:</strong> ${escapeHtml(project.client.email)}</p>
<h2>Objeto</h2>
<p>El presente contrato regula la prestación del servicio de <strong>${escapeHtml(serviceLabel)}</strong> para el proyecto <em>${escapeHtml(project.title)}</em>.</p>
<h2>Alcance y entregables</h2>
<ul>
<li><p>Desarrollo estratégico y creativo según propuesta aprobada.</p></li>
<li><p>Entregables definidos en el presupuesto y fases del proyecto.</p></li>
<li><p>Revisiones incluidas según lo acordado en la propuesta.</p></li>
</ul>
<h2>Inversión</h2>
<p><strong>Total:</strong> USD ${project.value.toLocaleString("en-US")}</p>
<p><strong>Forma de pago:</strong> 50% seña al firmar + 50% contra entrega final (salvo acuerdo distinto por escrito).</p>
<h2>Plazos</h2>
<p>Los plazos estimados se coordinarán al inicio del proyecto. El cliente se compromete a entregar feedback en un plazo razonable para no demorar la producción.</p>
<h2>Propiedad intelectual</h2>
<p>Tras el pago total, los derechos de uso de la identidad entregada pasan al cliente, salvo elementos de terceros o licencias específicas indicadas por escrito.</p>
<h2>Aceptación</h2>
<p>Al aceptar este contrato mediante el enlace único enviado al email registrado, marcando la casilla de consentimiento e indicando tu nombre completo, el cliente confirma haber leído y estar de acuerdo con estos términos. Esa aceptación electrónica constituye manifestación válida de consentimiento entre las partes.</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveContractHtml(
  content: ContractContent,
  project?: ContractProjectInput,
): string {
  const body = content.body?.trim() ?? "";
  if (body) {
    if (content.format === "html" || isPhaseHtmlBody(body)) return body;
    return markdownToPhaseHtml(body);
  }
  if (project) return getContractHtmlTemplate(project);
  return "";
}
