import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { sendPrebriefEmailToClient } from "@/lib/send-prebrief-email";
import { parseProjectPhases, setPhaseState } from "@/lib/prebrief-service";

type RouteParams = { params: Promise<{ id: string }> };

const sendSchema = z.object({
  personalNote: z.string().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = sendSchema.safeParse(json);
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

  if (project.prebriefSubmittedAt) {
    return NextResponse.json(
      { error: "El cliente ya envió el pre-brief. Podés ver las respuestas abajo." },
      { status: 409 },
    );
  }

  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);
  const phases = setPhaseState(parseProjectPhases(project.phases), "prebrief", "active");

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: projectId },
      data: { phases },
    });
    await tx.clientAccessToken.create({
      data: {
        token: plain,
        purpose: "pre-brief",
        expiresAt,
        clientId: project.clientId,
        projectId,
      },
    });
  });

  const emailed = await sendPrebriefEmailToClient({
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    token: plain,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    publicUrl: accessPublicUrl("pre-brief", plain),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
