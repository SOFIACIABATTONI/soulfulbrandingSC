import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { contractContentSchema, normalizeContractContent } from "@/lib/contract-types";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { sendContractEmailToClient } from "@/lib/send-contract-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  content: contractContentSchema.optional(),
  personalNote: z.string().optional(),
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

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (project.contractStatus === "aceptado") {
    return NextResponse.json(
      { error: "El contrato ya fue aceptado" },
      { status: 409 },
    );
  }

  const now = new Date();
  const content =
    parsed.data.content ??
    normalizeContractContent(project.contractContent);
  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: projectId },
      data: {
        contractContent: content,
        contractStatus: "enviado",
        contractSentAt: now,
      },
    });
    await tx.clientAccessToken.create({
      data: {
        token: plain,
        purpose: "contrato",
        expiresAt,
        clientId: project.clientId,
        projectId,
      },
    });
    if (project.client.leadId) {
      await tx.lead.update({
        where: { id: project.client.leadId },
        data: { pipelineStep: "contrato" },
      });
    }
  });

  const emailed = await sendContractEmailToClient({
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    token: plain,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    publicUrl: accessPublicUrl("contrato", plain),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
