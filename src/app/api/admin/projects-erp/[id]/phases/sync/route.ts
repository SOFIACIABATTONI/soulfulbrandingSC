import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import {
  buildProjectProgressInput,
  deriveWorkspacePhaseStates,
  loadProjectProgressInput,
  syncProjectPhasesFromProgress,
} from "@/lib/project-phase-sync";
import { deriveProjectStatus } from "@/lib/project-pipeline";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const phases = await syncProjectPhasesFromProgress(id);
  if (!phases) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const input = await loadProjectProgressInput(id);
  const derived = input ? deriveWorkspacePhaseStates(input) : null;

  return NextResponse.json({
    ok: true,
    phases,
    derived,
    progress: input
      ? {
          contractStatus: input.contractStatus,
          prebriefSubmittedAt: input.prebriefSubmittedAt,
          narrativaStatus: input.narrativaStatus,
          narrativaAcknowledgedAt: input.narrativaAcknowledgedAt,
          status: deriveProjectStatus({
            contractStatus: input.contractStatus,
            hasSenaPaid: input.hasSenaPaid,
            prebriefSubmittedAt: input.prebriefSubmittedAt,
            narrativaStatus: input.narrativaStatus,
            narrativaAcknowledgedAt: input.narrativaAcknowledgedAt,
            phases: phases ?? input.phases,
            projectStatus: input.projectStatus,
          }),
        }
      : null,
  });
}

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const input = await loadProjectProgressInput(id);
  if (!input) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    derived: deriveWorkspacePhaseStates(input),
    stored: input.phases,
  });
}
