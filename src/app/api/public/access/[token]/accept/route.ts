import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  validateAccessToken,
} from "@/lib/access-service";
import { resolveContractContent } from "@/lib/contract-default-content";
import { resolveContractHtml } from "@/lib/contract-html-templates";
import {
  extractClientIp,
  extractUserAgent,
  hashContractHtml,
  validateTypedName,
} from "@/lib/contract-acceptance";
import { acceptancePdfFilename, buildContractAcceptancePdf } from "@/lib/contract-acceptance-pdf";
import {
  sendContractAcceptedConfirmationToClient,
  sendContractAcceptedNotificationToAdmin,
} from "@/lib/send-contract-email";

type RouteParams = { params: Promise<{ token: string }> };

const acceptSchema = z.object({
  typedName: z.string().min(2),
  termsAccepted: z.literal(true),
});

export async function POST(req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "contrato");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const validationError = validateAccessToken(record);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = acceptSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Completá tu nombre y confirmá que aceptás los términos." },
      { status: 400 },
    );
  }

  const nameError = validateTypedName(parsed.data.typedName, record.client.name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const content = resolveContractContent({
    title: record.project.title,
    service: record.project.service,
    value: record.project.value,
    contractContent: record.project.contractContent,
    client: record.client,
  });
  const contractHtml = resolveContractHtml(content, {
    title: record.project.title,
    service: record.project.service,
    value: record.project.value,
    client: record.client,
  });
  const contentHash = hashContractHtml(contractHtml);
  const ipAddress = extractClientIp(req);
  const userAgent = extractUserAgent(req);
  const now = new Date();

  const acceptance = await prisma.$transaction(async (tx) => {
    await tx.clientAccessToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
    await tx.clientProject.update({
      where: { id: record.projectId },
      data: {
        contractStatus: "aceptado",
        contractAcceptedAt: now,
      },
    });
    const client = await tx.client.findUnique({
      where: { id: record.clientId },
      select: { leadId: true },
    });
    if (client?.leadId) {
      await tx.lead.update({
        where: { id: client.leadId },
        data: { pipelineStep: "sena" },
      });
    }

    return tx.contractAcceptance.create({
      data: {
        projectId: record.projectId,
        clientId: record.clientId,
        clientEmail: record.client.email,
        typedName: parsed.data.typedName.trim(),
        termsAccepted: true,
        ipAddress,
        userAgent,
        contentHash,
        contractHtml,
        acceptedAt: now,
      },
      include: {
        project: {
          select: { title: true, service: true, value: true },
        },
        client: {
          select: { name: true, email: true, company: true },
        },
      },
    });
  });

  const pdfBytes = await buildContractAcceptancePdf({
    id: acceptance.id,
    projectId: acceptance.projectId,
    clientEmail: acceptance.clientEmail,
    typedName: acceptance.typedName,
    termsAccepted: acceptance.termsAccepted,
    ipAddress: acceptance.ipAddress,
    userAgent: acceptance.userAgent,
    contentHash: acceptance.contentHash,
    contractHtml: acceptance.contractHtml,
    acceptedAt: acceptance.acceptedAt,
    project: acceptance.project,
    client: acceptance.client,
  });
  const pdfFilename = acceptancePdfFilename(acceptance.project.title);

  void sendContractAcceptedNotificationToAdmin({
    clientName: record.client.name,
    clientEmail: record.client.email,
    projectTitle: record.project.title,
    projectId: record.project.id,
    typedName: acceptance.typedName,
    acceptedAt: acceptance.acceptedAt,
    contentHash: acceptance.contentHash,
  });

  void sendContractAcceptedConfirmationToClient({
    toEmail: record.client.email,
    toName: record.client.name,
    projectTitle: record.project.title,
    typedName: acceptance.typedName,
    acceptedAt: acceptance.acceptedAt,
    contentHash: acceptance.contentHash,
    pdfBytes,
    pdfFilename,
  });

  const { syncProjectPhasesFromProgress } = await import("@/lib/project-phase-sync");
  void syncProjectPhasesFromProgress(record.projectId).catch((err) => {
    console.error("[contract-accept] syncProjectPhasesFromProgress:", err);
  });

  return NextResponse.json({
    ok: true,
    acceptedAt: now.toISOString(),
    contentHash,
  });
}
