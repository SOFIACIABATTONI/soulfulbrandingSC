import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
  isAccessTokenUsed,
} from "@/lib/access-service";
import { HTML_PHASE_SEND, purposeToHtmlPhaseKey } from "@/lib/phase-client-flow";
import {
  applyPhaseClientReceived,
  getPhaseClientMeta,
  storageKeyForHtmlPhase,
} from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { sendPhaseResponseNotificationToAdmin } from "@/lib/send-phase-doc-email";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const phaseKey = purposeToHtmlPhaseKey(record.purpose);
  if (!phaseKey) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const config = HTML_PHASE_SEND[phaseKey];
  const storageKey = storageKeyForHtmlPhase(phaseKey);

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: { title: true, phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const phaseData = phases[storageKey] ?? {};
  const meta = getPhaseClientMeta(phaseData);
  const html = phaseData.body ?? "";
  const used = isAccessTokenUsed(record);
  const received = meta.clientStatus === "recibido" || used;

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: project.title,
    portalTitle: config.portalTitle,
    htmlBody: html,
    canAcknowledge: !received && Boolean(html.trim()),
    done: received,
    ackButton: config.ackButton,
    ackSuccessTitle: config.ackSuccessTitle,
    ackSuccessBody: config.ackSuccessBody,
    sentAt: meta.clientSentAt || null,
    receivedAt: meta.clientReceivedAt || null,
    expiresAt: record.expiresAt,
  });
}

export async function POST(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const phaseKey = purposeToHtmlPhaseKey(record.purpose);
  if (!phaseKey) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  if (isAccessTokenUsed(record)) {
    return NextResponse.json({ error: "Ya confirmaste la recepción." }, { status: 409 });
  }

  const config = HTML_PHASE_SEND[phaseKey];
  const storageKey = storageKeyForHtmlPhase(phaseKey);

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const meta = getPhaseClientMeta(phases[storageKey]);
  if (meta.clientStatus === "recibido") {
    return NextResponse.json({ error: "Ya fue confirmado." }, { status: 409 });
  }

  const now = new Date();
  const nextPhases = applyPhaseClientReceived(phases, storageKey);

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: record.projectId },
      data: { phases: nextPhases },
    });
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
  });

  void sendPhaseResponseNotificationToAdmin({
    subject: config.adminNotifySubject,
    phaseLabel: config.title,
    hash: `#fase-${storageKey}`,
    clientName: project.client.name,
    clientEmail: project.client.email,
    projectTitle: project.title,
    projectId: project.id,
  });

  return NextResponse.json({ ok: true });
}
