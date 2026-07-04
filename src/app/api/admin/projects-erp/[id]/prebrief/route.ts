import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { getProjectPrebriefResponses } from "@/lib/prebrief-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: {
      prebriefResponses: true,
      prebriefSubmittedAt: true,
      client: { select: { name: true, email: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { responses, submittedAt } = getProjectPrebriefResponses(project);

  return NextResponse.json({
    submittedAt,
    answers: responses.answers,
    client: project.client,
  });
}
