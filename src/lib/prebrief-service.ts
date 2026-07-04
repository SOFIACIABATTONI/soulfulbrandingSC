import type { ClientProject } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizePrebriefResponses,
  type PrebriefResponses,
} from "@/lib/prebrief-types";

type PhaseMap = Record<string, Record<string, string>>;

export function parseProjectPhases(raw: unknown): PhaseMap {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PhaseMap;
  }
  return {};
}

export function setPhaseState(
  phases: PhaseMap,
  phaseKey: string,
  state: "pending" | "active" | "done",
): PhaseMap {
  const next = { ...phases };
  next[phaseKey] = { ...(next[phaseKey] ?? {}), state };
  return next;
}

export async function savePrebriefSubmission(
  project: Pick<ClientProject, "id" | "phases">,
  answers: Record<string, string>,
): Promise<PrebriefResponses> {
  const responses: PrebriefResponses = { answers };
  const phases = setPhaseState(parseProjectPhases(project.phases), "prebrief", "done");
  const now = new Date();

  await prisma.clientProject.update({
    where: { id: project.id },
    data: {
      prebriefResponses: responses,
      prebriefSubmittedAt: now,
      phases,
    },
  });

  return responses;
}

export function getProjectPrebriefResponses(project: {
  prebriefResponses: unknown;
  prebriefSubmittedAt: Date | null;
}) {
  return {
    responses: normalizePrebriefResponses(project.prebriefResponses),
    submittedAt: project.prebriefSubmittedAt,
  };
}
