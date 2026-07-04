import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { syncLeadPipelineOnSenaPaid } from "@/lib/lead-pipeline";
import { z } from "zod";
const patchSchema = z.object({
  type: z.enum(["sena", "final"]).optional(),
  total: z.number().positive().optional(),
  status: z.enum(["pendiente", "pagado"]).optional(),
  notes: z.string().optional(),
  paidAt: z.string().nullable().optional(),
  issuedAt: z.string().optional(),
  projectId: z.string().nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { paidAt, issuedAt, projectId, ...rest } = parsed.data;

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { clientId: true, type: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (projectId) {
    const project = await prisma.clientProject.findFirst({
      where: { id: projectId, clientId: existing.clientId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "El proyecto no pertenece a este cliente" },
        { status: 400 },
      );
    }
  }

  try {
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...rest,
        ...(projectId !== undefined ? { projectId } : {}),
        ...(paidAt !== undefined ? { paidAt: paidAt ? new Date(paidAt) : null } : {}),
        ...(issuedAt !== undefined ? { issuedAt: new Date(issuedAt) } : {}),
        // si se paga, registrar fecha automáticamente
        ...(rest.status === "pagado" && !paidAt ? { paidAt: new Date() } : {}),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, title: true } },
      },
    });
    if (updated.type === "sena" && updated.status === "pagado") {
      void syncLeadPipelineOnSenaPaid(updated.clientId).catch((err) => {
        console.error("[invoice] syncLeadPipelineOnSenaPaid:", err);
      });
    }
    return NextResponse.json({ ok: true, item: updated });  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
