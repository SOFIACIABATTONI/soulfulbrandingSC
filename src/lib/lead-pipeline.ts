/** Pasos del embudo comercial — orden fijo para comparar avance. */
export const PIPELINE_STEPS = [
  "form",
  "negociacion",
  "presupuesto",
  "contrato",
  "sena",
  "onboarding",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

const STEP_INDEX: Record<string, number> = Object.fromEntries(
  PIPELINE_STEPS.map((s, i) => [s, i]),
);

export function pipelineStepIndex(step: string): number {
  return STEP_INDEX[step] ?? STEP_INDEX.negociacion;
}

function maxPipelineStep(a: string, b: string): PipelineStep {
  return pipelineStepIndex(a) >= pipelineStepIndex(b)
    ? (a as PipelineStep)
    : (b as PipelineStep);
}

export type LeadPipelineSignals = {
  pipelineStep: string;
  quotes: { status: string; sentAt: Date | string | null }[];
  projects: { contractStatus: string }[];
  invoices: { type: string; status: string }[];
};

/**
 * Calcula el paso efectivo del embudo según datos reales del ERP
 * (presupuestos, contratos, facturas), no solo el campo manual del lead.
 */
export function derivePipelineStep(signals: LeadPipelineSignals): PipelineStep {
  let step: PipelineStep = (PIPELINE_STEPS.includes(signals.pipelineStep as PipelineStep)
    ? signals.pipelineStep
    : "negociacion") as PipelineStep;

  if (signals.quotes.some((q) => q.sentAt)) {
    step = maxPipelineStep(step, "presupuesto");
  }
  if (signals.quotes.some((q) => q.status === "aprobado")) {
    step = maxPipelineStep(step, "contrato");
  }
  if (signals.projects.some((p) => p.contractStatus === "aceptado")) {
    step = maxPipelineStep(step, "sena");
  }
  if (
    signals.invoices.some(
      (i) => (i.type === "sena" || i.type === "final") && i.status === "pagado",
    )
  ) {
    step = maxPipelineStep(step, "onboarding");
  }

  return step;
}

/** Persiste avance cuando se registra el pago de seña o factura final. */
export async function syncLeadPipelineOnPaymentPaid(clientId: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { leadId: true },
  });
  if (!client?.leadId) return;

  const lead = await prisma.lead.findUnique({
    where: { id: client.leadId },
    select: { pipelineStep: true },
  });
  if (!lead) return;

  if (pipelineStepIndex(lead.pipelineStep) < pipelineStepIndex("onboarding")) {
    await prisma.lead.update({
      where: { id: client.leadId },
      data: { pipelineStep: "onboarding", status: "ganado" },
    });
  }
}

/** @deprecated Usar syncLeadPipelineOnPaymentPaid */
export async function syncLeadPipelineOnSenaPaid(clientId: string): Promise<void> {
  return syncLeadPipelineOnPaymentPaid(clientId);
}
