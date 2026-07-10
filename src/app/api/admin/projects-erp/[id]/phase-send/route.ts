import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateAccessToken, accessExpiryForPurpose } from "@/lib/access-token";
import { accessPublicUrl } from "@/lib/access-url";
import {
  HTML_PHASE_SEND,
  isSendableClientPhaseKey,
  resolvePhaseSendConfig,
  type HtmlPhaseKey,
} from "@/lib/phase-client-flow";
import { applyPhaseClientSent, storageKeyForHtmlPhase } from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { brandKitFromPhaseData, brandKitHasContent } from "@/lib/brand-kit";
import { getManualPdfFromPhase, hasManualPdf } from "@/lib/manual-pdf";
import { findCustomPhaseTitle } from "@/lib/project-phase-layout";
import { syncProjectPhasesFromProgress } from "@/lib/project-phase-sync";
import { sendPhaseDocEmailToClient } from "@/lib/send-phase-doc-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  phase: z.string().refine(isSendableClientPhaseKey, { message: "Fase no enviable" }),
  html: z.string().optional(),
  personalNote: z.string().optional(),
  customTitle: z.string().optional(),
  brandKit: z.string().optional(),
  manualPdfUrl: z.string().optional(),
  manualPdfFileName: z.string().optional(),
  manualPdfMime: z.string().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const phaseKey = parsed.data.phase;
  const isCustom = phaseKey.startsWith("custom-");

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const customTitle = isCustom
    ? (parsed.data.customTitle?.trim() || findCustomPhaseTitle(phases, phaseKey) || "Entrega")
    : undefined;
  const config = resolvePhaseSendConfig(phaseKey, { customTitle });
  if (!config) {
    return NextResponse.json({ error: "Fase no enviable" }, { status: 400 });
  }

  const storageKey = isCustom ? phaseKey : storageKeyForHtmlPhase(phaseKey as HtmlPhaseKey);
  const storedPhaseData = phases[storageKey] ?? {};
  const phaseData: Record<string, string> = {
    ...storedPhaseData,
    ...(parsed.data.brandKit !== undefined ? { brandKit: parsed.data.brandKit } : {}),
    ...(parsed.data.manualPdfUrl !== undefined ? { manualPdfUrl: parsed.data.manualPdfUrl } : {}),
    ...(parsed.data.manualPdfFileName !== undefined
      ? { manualPdfFileName: parsed.data.manualPdfFileName }
      : {}),
    ...(parsed.data.manualPdfMime !== undefined ? { manualPdfMime: parsed.data.manualPdfMime } : {}),
  };
  const html = (parsed.data.html ?? phaseData.body ?? "").trim();
  const brandKit = brandKitFromPhaseData(phaseData);
  const manualPdf = getManualPdfFromPhase(phaseData);
  const hasDoc = Boolean(html && html !== "<p></p>");
  const hasKit = brandKitHasContent(brandKit);
  const hasPdf = hasManualPdf(phaseData);

  if (isCustom) {
    if (!hasDoc) {
      return NextResponse.json(
        { error: "Completá el documento antes de enviar." },
        { status: 400 },
      );
    }
  } else if (phaseKey === "manual") {
    if (!hasPdf) {
      return NextResponse.json(
        { error: "Subí el PDF del manual antes de enviar." },
        { status: 400 },
      );
    }
  } else if (!hasDoc && !hasKit) {
    return NextResponse.json(
      { error: "Completá el documento o el brand kit antes de enviar." },
      { status: 400 },
    );
  }

  const plain = generateAccessToken();
  const expiresAt = accessExpiryForPurpose(config.purpose);
  const nextPhases = applyPhaseClientSent(phases, storageKey);
  nextPhases[storageKey] = {
    ...nextPhases[storageKey],
    ...(hasDoc ? { body: html, bodyFormat: "html" as const } : {}),
    ...(phaseKey === "identidad" && hasKit && phaseData.brandKit
      ? { brandKit: phaseData.brandKit }
      : {}),
    ...(phaseKey === "manual" && manualPdf
      ? {
          manualPdfUrl: manualPdf.url,
          manualPdfFileName: manualPdf.fileName,
          manualPdfMime: manualPdf.mime,
        }
      : {}),
  };

  let clientToken = plain;

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: projectId },
      data: { phases: nextPhases },
    });

    const existing = await tx.clientAccessToken.findFirst({
      where: { projectId, purpose: config.purpose },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      clientToken = existing.token;
      await tx.clientAccessToken.update({
        where: { id: existing.id },
        data: { expiresAt, usedAt: null },
      });
    } else {
      await tx.clientAccessToken.create({
        data: {
          token: plain,
          purpose: config.purpose,
          expiresAt,
          clientId: project.clientId,
          projectId,
        },
      });
    }
  });

  await syncProjectPhasesFromProgress(projectId);

  const emailed = await sendPhaseDocEmailToClient({
    config,
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    token: clientToken,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    publicUrl: accessPublicUrl(config.purpose, clientToken),
    publicToken: process.env.NODE_ENV === "development" ? clientToken : undefined,
  });
}
