import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  isAccessTokenExpired,
  isAccessTokenUsed,
} from "@/lib/access-service";
import { resolvePhasePortalContext } from "@/lib/phase-client-flow";
import {
  applyPhaseClientReceived,
  getPhaseClientMeta,
} from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { sendPhaseResponseNotificationToAdmin } from "@/lib/send-phase-doc-email";
import { isPermanentAccessPurpose } from "@/lib/access-token";
import { brandKitFromPhaseData, brandKitHasContent } from "@/lib/brand-kit";
import { getManualPdfFromPhase, hasManualPdf } from "@/lib/manual-pdf";
import { resolveClientPortalHtmlBody } from "@/lib/phase-client-portal";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    select: { title: true, phases: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const portal = resolvePhasePortalContext(record.purpose, phases);
  if (!portal) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const { storageKey, config, htmlPhaseKey, isCustom } = portal;
  const phaseData = phases[storageKey] ?? {};
  const meta = getPhaseClientMeta(phaseData);
  const html = phaseData.body ?? "";
  const brandKit = brandKitFromPhaseData(phaseData);
  const hasBrandKit = htmlPhaseKey === "identidad" && brandKitHasContent(brandKit);
  const clientHtmlBody = htmlPhaseKey
    ? resolveClientPortalHtmlBody(htmlPhaseKey, html, { hasBrandKit })
    : html;
  const used = isAccessTokenUsed(record);
  const permanentLink = isPermanentAccessPurpose(record.purpose);
  const received =
    meta.clientStatus === "recibido" || (!permanentLink && used);
  const downloadUrl = `/api/public/phase-doc/${encodeURIComponent(token)}/download`;
  const brandKitZipUrl = `/api/public/phase-doc/${encodeURIComponent(token)}/download-zip`;
  const manualPdf = getManualPdfFromPhase(phaseData);
  const hasPdf = htmlPhaseKey === "manual" && hasManualPdf(phaseData);
  const manualPdfDownloadUrl = hasPdf
    ? `/api/public/phase-doc/${encodeURIComponent(token)}/manual-pdf`
    : null;

  const hasContent = isCustom
    ? Boolean(clientHtmlBody.trim() && clientHtmlBody !== "<p></p>")
    : Boolean(clientHtmlBody.trim()) || hasBrandKit || hasPdf;

  return NextResponse.json({
    clientName: record.client.name,
    projectTitle: project.title,
    portalTitle: config.portalTitle,
    htmlBody: clientHtmlBody,
    canAcknowledge: !received && hasContent,
    done: received,
    ackButton: config.ackButton,
    ackSuccessTitle: config.ackSuccessTitle,
    ackSuccessBody: config.ackSuccessBody,
    sentAt: meta.clientSentAt || null,
    receivedAt: meta.clientReceivedAt || null,
    expiresAt: permanentLink ? null : record.expiresAt,
    permanentLink,
    canDownload:
      !isCustom &&
      ((Boolean(clientHtmlBody.trim()) && clientHtmlBody !== "<p></p>") ||
        hasBrandKit ||
        hasPdf),
    downloadUrl: isCustom ? null : downloadUrl,
    brandKitZipUrl: hasBrandKit ? brandKitZipUrl : null,
    brandKit: hasBrandKit ? brandKit : undefined,
    hasBrandKit,
    manualPdf: manualPdf
      ? { fileName: manualPdf.fileName, downloadUrl: manualPdfDownloadUrl }
      : null,
    hasManualPdf: hasPdf,
  });
}

export async function POST(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token);
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: record.projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const portal = resolvePhasePortalContext(record.purpose, phases);
  if (!portal) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  if (isAccessTokenExpired(record)) {
    return NextResponse.json({ error: "Este enlace expiró." }, { status: 410 });
  }

  const { storageKey, config } = portal;
  const meta = getPhaseClientMeta(phases[storageKey]);
  if (meta.clientStatus === "recibido") {
    return NextResponse.json({ error: "Ya fue confirmado." }, { status: 409 });
  }

  const permanentLink = isPermanentAccessPurpose(record.purpose);
  if (isAccessTokenUsed(record) && !permanentLink) {
    return NextResponse.json({ error: "Ya confirmaste la recepción." }, { status: 409 });
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

  const { syncProjectPhasesFromProgress } = await import("@/lib/project-phase-sync");
  await syncProjectPhasesFromProgress(record.projectId);

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
