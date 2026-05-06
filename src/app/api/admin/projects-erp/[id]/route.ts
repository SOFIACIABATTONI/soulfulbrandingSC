import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  service: z
    .enum(["identidad-de-marca", "estrategia-visual", "diseno-editorial"])
    .optional(),
  value: z.number().positive().optional(),
  status: z
    .enum(["onboarding", "diseno", "implementacion", "entregado"])
    .optional(),
  startDate: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  notes: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await prisma.clientProject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, number: true, type: true, total: true, status: true, issuedAt: true,
        },
      },
      _count: { select: { invoices: true } },
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
  const { startDate, deliveryDate, ...rest } = parsed.data;
  try {
    const updated = await prisma.clientProject.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined
          ? { startDate: startDate ? new Date(startDate) : null }
          : {}),
        ...(deliveryDate !== undefined
          ? { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }
          : {}),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.clientProject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.clientAccessToken.deleteMany({ where: { projectId: id } });
      await tx.invoice.deleteMany({ where: { projectId: id } });
      await tx.clientProject.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/projects-erp DELETE]", e);
    return NextResponse.json(
      { error: "No se pudo eliminar (restricción en base de datos)" },
      { status: 409 },
    );
  }
}
