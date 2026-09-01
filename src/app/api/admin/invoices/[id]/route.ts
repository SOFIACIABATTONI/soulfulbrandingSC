import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { validateInvoiceCreate } from "@/lib/invoice-utils";
import { syncOnProjectInvoicePaid } from "@/lib/project-phase-sync";
import { z } from "zod";
const patchSchema = z.object({
  type: z.enum(["sena", "final"]).optional(),
  total: z.number().positive().optional(),
  status: z.enum(["pendiente", "pagado"]).optional(),
  notes: z.string().optional(),
  paidAt: z.string().nullable().optional(),
  issuedAt: z.string().optional(),
  dueAt: z.string().nullable().optional(),
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
  const { paidAt, issuedAt, dueAt, projectId, ...rest } = parsed.data;

  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      type: true,
      status: true,
      total: true,
      projectId: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const targetProjectId =
    projectId !== undefined ? projectId : existing.projectId;

  if (targetProjectId) {
    const project = await prisma.clientProject.findFirst({
      where: { id: targetProjectId, clientId: existing.clientId },
      select: {
        id: true,
        value: true,
        invoices: {
          select: { id: true, type: true, status: true, total: true, projectId: true },
        },
      },
    });
    if (!project) {
      return NextResponse.json(
        { error: "El proyecto no pertenece a este cliente" },
        { status: 400 },
      );
    }

    const nextTotal = rest.total ?? existing.total;
    const nextStatus = (rest.status ?? existing.status) as "pendiente" | "pagado";
    const validation = validateInvoiceCreate(
      (rest.type ?? existing.type) as "sena" | "final",
      targetProjectId,
      project.value,
      project.invoices,
      {
        excludeInvoiceId: existing.id,
        newTotal: nextTotal,
        newStatus: nextStatus,
      },
    );
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
  } else if (projectId) {
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
    const reminderReset =
      dueAt !== undefined
        ? {
            reminder7dSentAt: null,
            reminder1dSentAt: null,
            reminderDueSentAt: null,
          }
        : {};

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...rest,
        ...reminderReset,
        ...(projectId !== undefined ? { projectId } : {}),
        ...(paidAt !== undefined ? { paidAt: paidAt ? new Date(paidAt) : null } : {}),
        ...(issuedAt !== undefined ? { issuedAt: new Date(issuedAt) } : {}),
        ...(dueAt !== undefined
          ? { dueAt: dueAt ? new Date(`${dueAt}T12:00:00.000Z`) : null }
          : {}),
        // si se paga, registrar fecha automáticamente
        ...(rest.status === "pagado" && !paidAt ? { paidAt: new Date() } : {}),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        project: { select: { id: true, title: true } },
      },
    });
    if (updated.status === "pagado" && (updated.type === "sena" || updated.type === "final")) {
      void syncOnProjectInvoicePaid(updated).catch((err) => {
        console.error("[invoice] syncOnProjectInvoicePaid:", err);
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
