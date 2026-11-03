import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { accessPublicUrl } from "@/lib/access-url";
import { resolvePhaseSendConfig } from "@/lib/phase-client-flow";
import { parseProjectPhases } from "@/lib/prebrief-service";
import {
  findPhaseDisplayTitle,
  isBuiltinPhaseGenericMode,
} from "@/lib/project-phase-layout";

type RouteParams = { params: Promise<{ id: string }> };

const querySchema = z.object({
  phase: z.string().min(1),
});

export async function GET(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const parsedQuery = querySchema.safeParse({ phase: searchParams.get("phase") ?? "" });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
  }

  const phaseKey = parsedQuery.data.phase;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const genericBuiltin = isBuiltinPhaseGenericMode(phases, phaseKey);
  const customTitle = findPhaseDisplayTitle(phases, phaseKey) ?? undefined;
  const config = resolvePhaseSendConfig(phaseKey, { customTitle, genericBuiltin });
  if (!config) {
    return NextResponse.json({ publicUrl: null });
  }

  const token = await prisma.clientAccessToken.findFirst({
    where: { projectId, purpose: config.purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return NextResponse.json({ publicUrl: null });
  }

  return NextResponse.json({
    publicUrl: accessPublicUrl(config.purpose, token.token),
  });
}
