import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
  isAccessTokenUsed,
} from "@/lib/access-service";
import { resolveNarrativaContent } from "@/lib/narrativa-default-content";
import { resolveNarrativaHtml } from "@/lib/narrativa-html-templates";
import { syncProjectPhasesFromProgress } from "@/lib/project-phase-sync";
import { sendNarrativaAckNotificationToAdmin } from "@/lib/send-phase-doc-email";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "narrativa");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: {
      title: true,
      narrativaContent: true,
      narrativaSentAt: true,
      narrativaAcknowledgedAt: true,
      narrativaStatus: true,
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const content = resolveNarrativaContent({
    title: project.title,
    narrativaContent: project.narrativaContent,
    client: { name: record.client.name },
  });
  const htmlBody = resolveNarrativaHtml(content, {
    title: project.title,
    narrativaContent: project.narrativaContent,
    client: { name: record.client.name },
  });

  const received =
    project.narrativaStatus === "recibido" ||
    project.narrativaAcknowledgedAt != null ||
    isAccessTokenUsed(record);

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: project.title,
    content: { body: htmlBody, format: "html" as const },
    sentAt: project.narrativaSentAt,
    acknowledgedAt: project.narrativaAcknowledgedAt,
    canAcknowledge: !received,
    done: received,
    expiresAt: record.expiresAt,
  });
}

export async function POST(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "narrativa");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  if (isAccessTokenUsed(record)) {
    return NextResponse.json({ error: "Ya confirmaste la recepción." }, { status: 409 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  if (project.narrativaAcknowledgedAt) {
    return NextResponse.json({ error: "Ya fue confirmado." }, { status: 409 });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: record.projectId },
      data: {
        narrativaStatus: "recibido",
        narrativaAcknowledgedAt: now,
      },
    });
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
  });

  await syncProjectPhasesFromProgress(record.projectId);

  void sendNarrativaAckNotificationToAdmin({
    clientName: project.client.name,
    clientEmail: project.client.email,
    projectTitle: project.title,
    projectId: project.id,
  });

  return NextResponse.json({ ok: true });
}
