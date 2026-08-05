import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import {
  NARRATIVA_STATUS_LABELS,
  narrativaContentSchema,
  type NarrativaStatus,
} from "@/lib/narrativa-types";
import { resolveNarrativaContent } from "@/lib/narrativa-default-content";
import { DEEP_DIVE_CALENDAR_URL } from "@/lib/deep-dive-calendar";
import {
  DEEP_DIVE_STATUS_LABELS,
  normalizeDeepDiveStatus,
} from "@/lib/deep-dive-types";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  content: narrativaContentSchema,
});

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const content = resolveNarrativaContent({
    title: project.title,
    narrativaContent: project.narrativaContent,
    client: project.client,
  });
  const status = (project.narrativaStatus as NarrativaStatus) || "borrador";
  const deepDiveStatus = normalizeDeepDiveStatus(project.deepDiveStatus);

  return NextResponse.json({
    content,
    status,
    statusLabel: NARRATIVA_STATUS_LABELS[status] ?? status,
    narrativaSentAt: project.narrativaSentAt,
    narrativaAcknowledgedAt: project.narrativaAcknowledgedAt,
    deepDiveStatus,
    deepDiveStatusLabel: DEEP_DIVE_STATUS_LABELS[deepDiveStatus],
    deepDiveSentAt: project.deepDiveSentAt,
    deepDiveDoneAt: project.deepDiveDoneAt,
    deepDiveCalendarUrl: DEEP_DIVE_CALENDAR_URL,
    client: project.client,
    project: {
      id: project.id,
      title: project.title,
    },
  });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const project = await prisma.clientProject.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const item = await prisma.clientProject.update({
    where: { id },
    data: {
      narrativaContent: parsed.data.content as object,
      narrativaStatus:
        project.narrativaStatus === "recibido"
          ? "recibido"
          : project.narrativaStatus === "enviado"
            ? "enviado"
            : "borrador",
    },
  });

  return NextResponse.json({ ok: true, item });
}
