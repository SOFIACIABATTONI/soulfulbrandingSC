import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
} from "@/lib/access-service";
import { notifyAdminDeepDiveScheduled } from "@/lib/send-project-milestone-email";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "deep-dive");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: { title: true, deepDiveStatus: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const scheduled =
    project.deepDiveStatus === "agendado" || project.deepDiveStatus === "realizado";

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: project.title,
    scheduled,
    expiresAt: record.expiresAt,
  });
}

export async function POST(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "deep-dive");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  if (project.deepDiveStatus === "realizado") {
    return NextResponse.json({ ok: true, alreadyScheduled: true });
  }

  if (project.deepDiveStatus === "agendado") {
    return NextResponse.json({ ok: true, alreadyScheduled: true });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: record.projectId },
      data: {
        deepDiveStatus: "agendado",
      },
    });
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
  });

  await notifyAdminDeepDiveScheduled({
    clientName: project.client.name,
    clientEmail: project.client.email,
    projectTitle: project.title,
    projectId: project.id,
  });

  return NextResponse.json({ ok: true, scheduledAt: now.toISOString() });
}
