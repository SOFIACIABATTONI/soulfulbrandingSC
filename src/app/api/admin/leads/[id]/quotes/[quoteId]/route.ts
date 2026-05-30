import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { quoteContentSchema } from "@/lib/quote-types";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string; quoteId: string }> };

const patchSchema = z.object({
  content: quoteContentSchema.optional(),
});

async function loadQuote(leadId: string, quoteId: string) {
  return prisma.quote.findFirst({ where: { id: quoteId, leadId } });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id: leadId, quoteId } = await ctx.params;
  const existing = await loadQuote(leadId, quoteId);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (existing.status !== "borrador") {
    return NextResponse.json(
      { error: "Solo se puede editar un presupuesto en borrador" },
      { status: 409 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success || !parsed.data.content) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const item = await prisma.quote.update({
    where: { id: quoteId },
    data: { content: parsed.data.content },
  });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id: leadId, quoteId } = await ctx.params;
  const existing = await loadQuote(leadId, quoteId);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (existing.status !== "borrador") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar presupuestos en borrador" },
      { status: 409 },
    );
  }
  await prisma.quote.delete({ where: { id: quoteId } });
  return NextResponse.json({ ok: true });
}
