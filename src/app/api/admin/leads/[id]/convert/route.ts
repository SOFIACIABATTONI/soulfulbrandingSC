import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }
  if (lead.status === "ganado") {
    // Verificar si ya tiene un cliente vinculado
    const existing = await prisma.client.findUnique({ where: { leadId: id } });
    if (existing) {
      return NextResponse.json({ ok: true, item: existing, alreadyExisted: true });
    }
  }

  // Crear cliente y actualizar lead en una transacción
  const [client] = await prisma.$transaction([
    prisma.client.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        leadId: lead.id,
      },
    }),
    prisma.lead.update({
      where: { id },
      data: { status: "ganado" },
    }),
  ]);

  return NextResponse.json({ ok: true, item: client }, { status: 201 });
}
