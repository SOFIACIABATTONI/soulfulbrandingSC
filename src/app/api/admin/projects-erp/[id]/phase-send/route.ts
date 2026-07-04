import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { generateAccessToken, accessExpiryFromNow } from "@/lib/access-token";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";
import { accessPublicUrl } from "@/lib/access-url";
import { HTML_PHASE_SEND, type HtmlPhaseKey } from "@/lib/phase-client-flow";
import { applyPhaseClientSent, storageKeyForHtmlPhase } from "@/lib/phase-client-store";
import { parseProjectPhases } from "@/lib/prebrief-service";
import { sendPhaseDocEmailToClient } from "@/lib/send-phase-doc-email";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  phase: z.enum(["identidad", "manual"]),
  html: z.string().min(1).optional(),
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

  const phase = parsed.data.phase as HtmlPhaseKey;
  const config = HTML_PHASE_SEND[phase];
  const storageKey = storageKeyForHtmlPhase(phase);

  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const phaseData = phases[storageKey] ?? {};
  const html = (parsed.data.html ?? phaseData.body ?? "").trim();
  if (!html || html === "<p></p>") {
    return NextResponse.json(
      { error: "Completá el documento de la fase antes de enviar." },
      { status: 400 },
    );
  }

  const plain = generateAccessToken();
  const expiresAt = accessExpiryFromNow(ACCESS_EXPIRY_DAYS);
  const nextPhases = applyPhaseClientSent(phases, storageKey);
  nextPhases[storageKey] = { ...nextPhases[storageKey], body: html, bodyFormat: "html" };

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: projectId },
      data: { phases: nextPhases },
    });
    await tx.clientAccessToken.create({
      data: {
        token: plain,
        purpose: config.purpose,
        expiresAt,
        clientId: project.clientId,
        projectId,
      },
    });
  });

  const emailed = await sendPhaseDocEmailToClient({
    config,
    toEmail: project.client.email,
    toName: project.client.name,
    projectTitle: project.title,
    token: plain,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    publicUrl: accessPublicUrl(config.purpose, plain),
    publicToken: process.env.NODE_ENV === "development" ? plain : undefined,
  });
}
