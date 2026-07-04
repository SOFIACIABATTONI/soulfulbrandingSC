import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { sendNarrativaEmailToClient } from "@/lib/send-narrativa-email";
import { narrativaContentSchema, normalizeNarrativaContent } from "@/lib/narrativa-types";
import { parseProjectPhases, setPhaseState } from "@/lib/prebrief-service";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  content: narrativaContentSchema.optional(),
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

  const now = new Date();
  const content =
    parsed.data.content ?? normalizeNarrativaContent(project.narrativaContent);
  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);
  const phases = setPhaseState(parseProjectPhases(project.phases), "narrativa", "active");

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: projectId },
      data: {
        narrativaContent: content,
        narrativaStatus: "enviado",
        narrativaSentAt: now,
        phases,
      },
    });
    await tx.clientAccessToken.create({
      data: {
        token: plain,
        purpose: "narrativa",
        expiresAt,
        clientId: project.clientId,
        projectId,
      },
    });
  });

  const emailed = await sendNarrativaEmailToClient({
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    token: plain,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    publicUrl: accessPublicUrl("narrativa", plain),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
