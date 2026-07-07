import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { sendPhaseInternalNotesEmail } from "@/lib/send-phase-doc-email";
import { PHASE_DOCUMENT_TITLES, type PhaseDocumentKey } from "@/lib/phase-document-templates";
import { parseProjectPhases } from "@/lib/prebrief-service";

type RouteParams = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  phase: z.enum(["onboarding", "prebrief", "narrativa", "identidad", "manual"]),
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

  const phase = parsed.data.phase as PhaseDocumentKey;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const phases = parseProjectPhases(project.phases);
  const phaseData = phases[phase] ?? {};
  const html = (parsed.data.html ?? phaseData.body ?? "").trim();
  if (!html || html === "<p></p>") {
    return NextResponse.json(
      { error: "Completá las notas antes de enviarlas por mail." },
      { status: 400 },
    );
  }

  const emailed = await sendPhaseInternalNotesEmail({
    phaseTitle: PHASE_DOCUMENT_TITLES[phase],
    projectTitle: project.title,
    clientName: project.client.name,
    htmlBody: html,
    personalNote: parsed.data.personalNote,
  });

  return NextResponse.json({ ok: true, emailed });
}
