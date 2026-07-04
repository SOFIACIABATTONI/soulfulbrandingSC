import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAccessTokenByPlain,
  validateAccessToken,
} from "@/lib/access-service";
import { sendContractAcceptedNotificationToAdmin } from "@/lib/send-contract-email";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const record = await findAccessTokenByPlain(token, "contrato");
  if (!record) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  }

  const validationError = validateAccessToken(record);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 409 });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
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
  });

  void sendContractAcceptedNotificationToAdmin({
    clientName: record.client.name,
    clientEmail: record.client.email,
    projectTitle: record.project.title,
    projectId: record.project.id,
  });

  return NextResponse.json({ ok: true, acceptedAt: now.toISOString() });
}
