import { prisma } from "@/lib/prisma";
import { deriveProjectStatus, projectHasSenaPaid, type ProjectPipelineSignals } from "@/lib/project-pipeline";
import { parseProjectPhases, setPhaseState } from "@/lib/prebrief-service";

export const WORKSPACE_PHASE_KEYS = [
  "onboarding",
  "prebrief",
  "narrativa",
  "identidad",
  "manual",
] as const;

export type WorkspacePhaseKey = (typeof WORKSPACE_PHASE_KEYS)[number];
export type WorkspacePhaseState = "pending" | "active" | "done";

type PhaseMap = Record<string, Record<string, string>>;

export type ProjectProgressInput = {
  id: string;
  contractStatus: string;
  contractAcceptedAt: Date | null;
  contractSentAt: Date | null;
  prebriefSubmittedAt: Date | null;
  narrativaStatus: string;
  narrativaSentAt: Date | null;
  narrativaAcknowledgedAt: Date | null;
  projectStatus: string;
  hasSenaPaid: boolean;
  hasPrebriefSent: boolean;
  phases: PhaseMap;
};

export function buildProjectProgressInput(project: {
  id: string;
  contractStatus: string;
  contractAcceptedAt: Date | null;
  contractSentAt: Date | null;
  prebriefSubmittedAt: Date | null;
  narrativaStatus: string;
  narrativaSentAt: Date | null;
  narrativaAcknowledgedAt: Date | null;
  status: string;
  phases: unknown;
  invoices: { type: string; status: string; projectId?: string | null }[];
  hasPrebriefSent?: boolean;
}): ProjectProgressInput {
  return {
    id: project.id,
    contractStatus: project.contractStatus,
    contractAcceptedAt: project.contractAcceptedAt,
    contractSentAt: project.contractSentAt,
    prebriefSubmittedAt: project.prebriefSubmittedAt,
    narrativaStatus: project.narrativaStatus,
    narrativaSentAt: project.narrativaSentAt,
    narrativaAcknowledgedAt: project.narrativaAcknowledgedAt,
    projectStatus: project.status,
    hasSenaPaid: projectHasSenaPaid(project.invoices, project.id),
    hasPrebriefSent: project.hasPrebriefSent ?? false,
    phases: parseProjectPhases(project.phases),
  };
}

/** Calcula el estado de cada fase según hitos reales del proyecto. */
export function deriveWorkspacePhaseStates(
  input: ProjectProgressInput,
): Record<WorkspacePhaseKey, WorkspacePhaseState> {
  if (input.projectStatus === "entregado") {
    return {
      onboarding: "done",
      prebrief: "done",
      narrativa: "done",
      identidad: "done",
      manual: "done",
    };
  }

  const identidadClient = input.phases.identidad?.clientStatus ?? "";
  const manualClient = input.phases.manual?.clientStatus ?? "";

  let onboarding: WorkspacePhaseState = "pending";
  if (input.hasSenaPaid) onboarding = "done";
  else if (input.contractStatus === "aceptado" || input.contractStatus === "enviado") {
    onboarding = "active";
  }

  let prebrief: WorkspacePhaseState = "pending";
  if (input.prebriefSubmittedAt) prebrief = "done";
  else if (input.hasSenaPaid || input.hasPrebriefSent) prebrief = "active";

  let narrativa: WorkspacePhaseState = "pending";
  if (input.narrativaAcknowledgedAt || input.narrativaStatus === "recibido") {
    narrativa = "done";
  } else if (input.narrativaSentAt || input.narrativaStatus === "enviado") {
    narrativa = "active";
  } else if (prebrief === "done") {
    narrativa = "active";
  }

  let identidad: WorkspacePhaseState = "pending";
  if (identidadClient === "recibido") identidad = "done";
  else if (identidadClient === "enviado") identidad = "active";
  else if (narrativa === "done") identidad = "active";

  let manual: WorkspacePhaseState = "pending";
  if (manualClient === "recibido") manual = "done";
  else if (manualClient === "enviado") manual = "active";
  else if (identidad === "done") manual = "active";

  return { onboarding, prebrief, narrativa, identidad, manual };
}

export function applyDerivedPhaseStates(
  phasesRaw: unknown,
  derived: Record<WorkspacePhaseKey, WorkspacePhaseState>,
): PhaseMap {
  let phases = parseProjectPhases(phasesRaw);
  for (const key of WORKSPACE_PHASE_KEYS) {
    phases = setPhaseState(phases, key, derived[key]);
  }
  return phases;
}

export async function loadProjectProgressInput(
  projectId: string,
): Promise<ProjectProgressInput | null> {
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      contractStatus: true,
      contractAcceptedAt: true,
      contractSentAt: true,
      prebriefSubmittedAt: true,
      narrativaStatus: true,
      narrativaSentAt: true,
      narrativaAcknowledgedAt: true,
      status: true,
      phases: true,
      invoices: {
        select: { type: true, status: true, projectId: true },
      },
    },
  });
  if (!project) return null;

  const prebriefTokens = await prisma.clientAccessToken.count({
    where: { projectId, purpose: "pre-brief" },
  });

  return buildProjectProgressInput({
    ...project,
    hasPrebriefSent: prebriefTokens > 0,
  });
}

/** Persiste estados de fase alineados con el avance real del proyecto. */
export async function syncProjectPhasesFromProgress(
  projectId: string,
): Promise<Record<string, Record<string, string>> | null> {
  const input = await loadProjectProgressInput(projectId);
  if (!input) return null;

  const derived = deriveWorkspacePhaseStates(input);
  const nextPhases = applyDerivedPhaseStates(input.phases, derived);

  const signals: ProjectPipelineSignals = {
    contractStatus: input.contractStatus,
    hasSenaPaid: input.hasSenaPaid,
    prebriefSubmittedAt: input.prebriefSubmittedAt,
    narrativaStatus: input.narrativaStatus,
    narrativaAcknowledgedAt: input.narrativaAcknowledgedAt,
    phases: nextPhases,
    projectStatus: input.projectStatus,
  };
  const nextStatus = deriveProjectStatus(signals);

  const phasesChanged = WORKSPACE_PHASE_KEYS.some(
    (key) => (input.phases[key]?.state ?? "pending") !== derived[key],
  );
  const statusChanged =
    nextStatus !== input.projectStatus && input.projectStatus !== "entregado";

  if (phasesChanged || statusChanged) {
    await prisma.clientProject.update({
      where: { id: projectId },
      data: {
        ...(phasesChanged ? { phases: nextPhases } : {}),
        ...(statusChanged ? { status: nextStatus } : {}),
      },
    });
  }

  return nextPhases;
}

export async function syncOnSenaPaidInvoice(invoice: {
  clientId: string;
  projectId: string | null;
  type: string;
  status: string;
}): Promise<void> {
  if (invoice.type !== "sena" || invoice.status !== "pagado") return;

  const { syncLeadPipelineOnSenaPaid } = await import("@/lib/lead-pipeline");
  await syncLeadPipelineOnSenaPaid(invoice.clientId);
  if (invoice.projectId) {
    await syncProjectPhasesFromProgress(invoice.projectId);
  }
}

/** @deprecated Usar syncProjectPhasesFromProgress */
export async function syncProjectPhasesOnSenaPaid(
  projectId: string | null | undefined,
): Promise<void> {
  if (projectId) await syncProjectPhasesFromProgress(projectId);
}

export function mergePhasesWithDerivedStates<T extends { state: string }>(
  stored: Record<string, T>,
  derived: Record<WorkspacePhaseKey, WorkspacePhaseState>,
): Record<string, T> {
  const next = { ...stored };
  for (const key of WORKSPACE_PHASE_KEYS) {
    if (next[key]) {
      next[key] = { ...next[key], state: derived[key] };
    }
  }
  return next;
}
