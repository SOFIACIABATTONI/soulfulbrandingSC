import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { HTML_PHASE_SEND, type HtmlPhaseKey } from "@/lib/phase-client-flow";
import {
  applyPhaseClientReceived,
  applyPhaseClientReopened,
} from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import {
  syncProjectPhasesFromProgress,
  WORKSPACE_PHASE_KEYS,
  type WorkspacePhaseKey,
} from "@/lib/project-phase-sync";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  phase: z.enum(WORKSPACE_PHASE_KEYS),
  action: z.enum(["mark_received", "reopen_ack"]),
});

function isHtmlPhaseKey(phase: WorkspacePhaseKey): phase is HtmlPhaseKey {
  return phase === "identidad" || phase === "manual";
}

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const phase = parsed.data.phase;
  const storageKey = phase;

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const now = new Date();
  const htmlConfig = isHtmlPhaseKey(phase) ? HTML_PHASE_SEND[phase] : null;

  if (parsed.data.action === "mark_received") {
    const nextPhases = applyPhaseClientReceived(phases, storageKey);
    await prisma.$transaction(async (tx) => {
      await tx.clientProject.update({
        where: { id: projectId },
        data: { phases: nextPhases },
      });
      if (htmlConfig) {
        const token = await tx.clientAccessToken.findFirst({
          where: { projectId, purpose: htmlConfig.purpose },
          orderBy: { createdAt: "desc" },
        });
        if (token) {
          await tx.clientAccessToken.update({
            where: { id: token.id },
            data: { usedAt: now },
          });
        }
      }
    });
  } else {
    const nextPhases = applyPhaseClientReopened(phases, storageKey);
    await prisma.$transaction(async (tx) => {
      await tx.clientProject.update({
        where: { id: projectId },
        data: { phases: nextPhases },
      });
      if (htmlConfig) {
        const token = await tx.clientAccessToken.findFirst({
          where: { projectId, purpose: htmlConfig.purpose },
          orderBy: { createdAt: "desc" },
        });
        if (token) {
          await tx.clientAccessToken.update({
            where: { id: token.id },
            data: { usedAt: null },
          });
        }
      }
    });
  }

  const syncedPhases = await syncProjectPhasesFromProgress(projectId);
  return NextResponse.json({ ok: true, phases: syncedPhases });
}
