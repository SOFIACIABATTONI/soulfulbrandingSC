/** Pasos del ciclo de vida de un ClientProject (después del embudo comercial del lead). */
export const PROJECT_FLOW_STEPS = [
  { key: "contrato", label: "Contrato" },
  { key: "sena", label: "Seña" },
  { key: "onboarding", label: "Onboarding" },
  { key: "prebrief", label: "Pre-brief" },
  { key: "narrativa", label: "Narrativa" },
  { key: "identidad", label: "Identidad" },
  { key: "manual", label: "Manual" },
  { key: "entregado", label: "Entregado" },
] as const;

export type ProjectFlowStepKey = (typeof PROJECT_FLOW_STEPS)[number]["key"];

export type ProjectPipelineSignals = {
  contractStatus: string;
  hasSenaPaid: boolean;
  /** Pago total (factura final) — también habilita onboarding como la seña. */
  hasFinalPaid?: boolean;
  prebriefSubmittedAt?: Date | string | null;
  narrativaStatus?: string;
  narrativaAcknowledgedAt?: Date | string | null;
  phases: Record<string, { state?: string } | undefined>;
  projectStatus: string;
};

function onboardingPaymentDone(signals: ProjectPipelineSignals): boolean {
  return Boolean(signals.hasSenaPaid || signals.hasFinalPaid);
}

function phaseDone(phases: ProjectPipelineSignals["phases"], key: string): boolean {
  return phases[key]?.state === "done";
}

export function isProjectStepDone(
  stepKey: ProjectFlowStepKey,
  signals: ProjectPipelineSignals,
): boolean {
  switch (stepKey) {
    case "contrato":
      return signals.contractStatus === "aceptado";
    case "sena":
      return signals.hasSenaPaid;
    case "onboarding":
      return onboardingPaymentDone(signals) || phaseDone(signals.phases, "onboarding");
    case "prebrief":
      return Boolean(signals.prebriefSubmittedAt) || phaseDone(signals.phases, "prebrief");
    case "narrativa":
      return (
        Boolean(signals.narrativaAcknowledgedAt) ||
        signals.narrativaStatus === "recibido" ||
        phaseDone(signals.phases, "narrativa")
      );
    case "identidad":
      return phaseDone(signals.phases, "identidad");
    case "manual":
      return phaseDone(signals.phases, "manual");
    case "entregado":
      return signals.projectStatus === "entregado" || phaseDone(signals.phases, "manual");
    default:
      return false;
  }
}

/** Índice del paso activo (0-based). Si todo está completo, apunta al último. */
export function deriveProjectActiveIndex(signals: ProjectPipelineSignals): number {
  for (let i = 0; i < PROJECT_FLOW_STEPS.length; i++) {
    if (!isProjectStepDone(PROJECT_FLOW_STEPS[i].key, signals)) {
      return i;
    }
  }
  return PROJECT_FLOW_STEPS.length - 1;
}

export type ProjectStatus = "onboarding" | "diseno" | "implementacion" | "entregado";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  onboarding: "Onboarding",
  diseno: "Diseño",
  implementacion: "Implementación",
  entregado: "Entregado",
};

/** Estado global del proyecto según el hito activo del pipeline. */
export function deriveProjectStatus(signals: ProjectPipelineSignals): ProjectStatus {
  if (signals.projectStatus === "entregado") return "entregado";
  if (phaseDone(signals.phases, "manual")) return "entregado";

  const step = PROJECT_FLOW_STEPS[deriveProjectActiveIndex(signals)]?.key;

  switch (step) {
    case "contrato":
    case "sena":
    case "onboarding":
    case "prebrief":
      return "onboarding";
    case "narrativa":
    case "identidad":
      return "diseno";
    case "manual":
    case "entregado":
      return "implementacion";
    default:
      return "onboarding";
  }
}

export function projectHasSenaPaid(
  invoices: { type: string; status: string; projectId?: string | null }[],
  projectId: string,
): boolean {
  return invoices.some(
    (i) => i.type === "sena" && i.status === "pagado" && i.projectId === projectId,
  );
}

export function projectHasFinalPaid(
  invoices: { type: string; status: string; projectId?: string | null }[],
  projectId: string,
): boolean {
  return invoices.some(
    (i) => i.type === "final" && i.status === "pagado" && i.projectId === projectId,
  );
}

export function projectHasOnboardingPaid(
  invoices: { type: string; status: string; projectId?: string | null }[],
  projectId: string,
): boolean {
  return projectHasSenaPaid(invoices, projectId) || projectHasFinalPaid(invoices, projectId);
}
