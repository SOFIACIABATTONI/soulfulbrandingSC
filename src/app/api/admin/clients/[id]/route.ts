import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await prisma.client.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, service: true, estimatedValue: true } },
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          service: true,
          status: true,
          value: true,
          startDate: true,
          deliveryDate: true,
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          type: true,
          total: true,
          status: true,
          issuedAt: true,
        },
      },
      _count: { select: { projects: true, invoices: true } },
    },
  });
  if (!item) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
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
  try {
    const updated = await prisma.client.update({
      where: { id },
      data: parsed.data,
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
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.clientAccessToken.deleteMany({ where: { clientId: id } });
      await tx.invoice.deleteMany({ where: { clientId: id } });
      await tx.clientProject.deleteMany({ where: { clientId: id } });
      await tx.client.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/clients DELETE]", e);
    return NextResponse.json(
      { error: "No se pudo eliminar (restricción en base de datos)" },
      { status: 409 },
    );
  }
}
