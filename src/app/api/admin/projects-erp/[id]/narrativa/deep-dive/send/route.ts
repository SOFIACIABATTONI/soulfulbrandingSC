import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth-api";
import { DEEP_DIVE_CALENDAR_URL } from "@/lib/deep-dive-calendar";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { sendDeepDiveEmailToClient } from "@/lib/send-deep-dive-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  personalNote: z.string().max(2000).optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: { client: { select: { name: true, email: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);
  const sentAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientAccessToken.create({
      data: {
        token: plain,
        purpose: "deep-dive",
        expiresAt,
        clientId: project.clientId,
        projectId: id,
      },
    });
    await tx.clientProject.update({
      where: { id },
      data: {
        deepDiveStatus: project.deepDiveDoneAt ? "realizado" : "enviado",
        deepDiveSentAt: sentAt,
      },
    });
  });

  const scheduleConfirmUrl = accessPublicUrl("deep-dive", plain);

  const emailed = await sendDeepDiveEmailToClient({
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    personalNote: parsed.data.personalNote,
    scheduleConfirmUrl,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    calendarUrl: DEEP_DIVE_CALENDAR_URL,
    scheduleConfirmUrl,
    deepDiveSentAt: sentAt.toISOString(),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
