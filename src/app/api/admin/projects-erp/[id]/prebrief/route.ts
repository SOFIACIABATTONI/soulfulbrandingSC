import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { getProjectPrebriefResponses } from "@/lib/prebrief-service";
import {
  getDefaultPrebriefTemplate,
  prebriefTemplateSchema,
  resolvePrebriefTemplate,
  serializePrebriefTemplateForPhases,
} from "@/lib/prebrief-template";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: {
      phases: true,
      prebriefResponses: true,
      prebriefSubmittedAt: true,
      client: { select: { name: true, email: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { responses, submittedAt } = getProjectPrebriefResponses(project);
  const template = resolvePrebriefTemplate(project.phases);

  return NextResponse.json({
    submittedAt,
    answers: responses.answers,
    template,
    client: project.client,
  });
}

const patchSchema = z.object({
  template: prebriefTemplateSchema,
});

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { phases: true, prebriefSubmittedAt: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (project.prebriefSubmittedAt) {
    return NextResponse.json(
      { error: "El cliente ya respondió Brand Soul; la plantilla ya no se puede editar." },
      { status: 409 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const phases = serializePrebriefTemplateForPhases(project.phases, parsed.data.template);
  await prisma.clientProject.update({
    where: { id: projectId },
    data: { phases },
  });

  return NextResponse.json({ ok: true, template: parsed.data.template });
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: { phases: true, prebriefSubmittedAt: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (project.prebriefSubmittedAt) {
    return NextResponse.json({ error: "No se puede restaurar tras la respuesta del cliente." }, { status: 409 });
  }

  const phases = serializePrebriefTemplateForPhases(project.phases, getDefaultPrebriefTemplate());
  await prisma.clientProject.update({
    where: { id: projectId },
    data: { phases },
  });

  return NextResponse.json({ ok: true, template: getDefaultPrebriefTemplate() });
}
