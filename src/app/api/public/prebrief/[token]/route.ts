import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findAccessTokenByPlain, isAccessTokenExpired } from "@/lib/access-service";
import { getProjectPrebriefResponses } from "@/lib/prebrief-service";
import { resolvePrebriefTemplate } from "@/lib/prebrief-template";
import { notifyAdminPrebriefSubmitted } from "@/lib/send-project-milestone-email";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "pre-brief");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: {
      phases: true,
      prebriefResponses: true,
      prebriefSubmittedAt: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const template = resolvePrebriefTemplate(project.phases);
  const { responses, submittedAt } = getProjectPrebriefResponses(project);
  const submitted = Boolean(submittedAt);

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: record.project.title,
    fields: template.fields,
    intro: {
      questionnaire: template.questionnaireIntro,
      outro: template.outro,
    },
    answers: responses.answers,
    submitted,
    submittedAt,
    canSubmit: !submitted,
    expiresAt: record.expiresAt,
  });
}

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "pre-brief");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  if (project.prebriefSubmittedAt) {
    return NextResponse.json({ error: "Brand Soul ya fue enviado." }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const template = resolvePrebriefTemplate(project.phases);
  const trimmed: Record<string, string> = {};
  for (const field of template.fields) {
    trimmed[field.id] = (parsed.data.answers[field.id] ?? "").trim();
  }

  const hasAny = Object.values(trimmed).some((v) => v.length > 0);
  if (!hasAny) {
    return NextResponse.json(
      { error: "Completá al menos una respuesta antes de enviar." },
      { status: 400 },
    );
  }

  const { syncProjectPhasesFromProgress } = await import("@/lib/project-phase-sync");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: project.id },
      data: {
        prebriefResponses: { answers: trimmed },
        prebriefSubmittedAt: now,
      },
    });
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
  });

  await syncProjectPhasesFromProgress(project.id);

  await notifyAdminPrebriefSubmitted({
    clientName: record.client.name,
    clientEmail: record.client.email,
    projectTitle: record.project.title,
    projectId: record.project.id,
  });

  return NextResponse.json({ ok: true, submittedAt: now.toISOString() });
}
