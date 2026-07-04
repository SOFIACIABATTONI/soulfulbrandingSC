import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findAccessTokenByPlain, isAccessTokenExpired } from "@/lib/access-service";
import {
  PREBRIEF_FIELDS,
  PREBRIEF_INTRO_DIAGNOSTIC,
  PREBRIEF_INTRO_PROCESS,
  PREBRIEF_INTRO_WELCOME,
  PREBRIEF_OUTRO,
} from "@/lib/prebrief-content";
import { getProjectPrebriefResponses } from "@/lib/prebrief-service";

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
      prebriefResponses: true,
      prebriefSubmittedAt: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const { responses, submittedAt } = getProjectPrebriefResponses(project);
  const submitted = Boolean(submittedAt);

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: record.project.title,
    fields: PREBRIEF_FIELDS,
    intro: {
      welcome: PREBRIEF_INTRO_WELCOME,
      process: PREBRIEF_INTRO_PROCESS,
      diagnostic: PREBRIEF_INTRO_DIAGNOSTIC,
      outro: PREBRIEF_OUTRO,
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
    return NextResponse.json({ error: "El pre-brief ya fue enviado." }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const trimmed: Record<string, string> = {};
  for (const field of PREBRIEF_FIELDS) {
    trimmed[field.id] = (parsed.data.answers[field.id] ?? "").trim();
  }

  const hasAny = Object.values(trimmed).some((v) => v.length > 0);
  if (!hasAny) {
    return NextResponse.json(
      { error: "Completá al menos una respuesta antes de enviar." },
      { status: 400 },
    );
  }

  const { parseProjectPhases, setPhaseState } = await import("@/lib/prebrief-service");
  const { sendPrebriefSubmittedNotificationToAdmin } = await import("@/lib/send-prebrief-email");

  const now = new Date();
  const phases = setPhaseState(parseProjectPhases(project.phases), "prebrief", "done");

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: project.id },
      data: {
        prebriefResponses: { answers: trimmed },
        prebriefSubmittedAt: now,
        phases,
      },
    });
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
  });

  void sendPrebriefSubmittedNotificationToAdmin({
    clientName: record.client.name,
    clientEmail: record.client.email,
    projectTitle: record.project.title,
    projectId: record.project.id,
  });

  return NextResponse.json({ ok: true, submittedAt: now.toISOString() });
}
