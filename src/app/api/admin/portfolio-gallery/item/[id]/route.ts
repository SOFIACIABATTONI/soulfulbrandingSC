import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.portfolioGalleryItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await prisma.portfolioGalleryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { sortOrder?: number } | null;
  if (body?.sortOrder == null || !Number.isFinite(body.sortOrder)) {
    return NextResponse.json({ error: "sortOrder requerido" }, { status: 400 });
  }
  const updated = await prisma.portfolioGalleryItem.update({
    where: { id },
    data: { sortOrder: Math.trunc(body.sortOrder) },
  });
  return NextResponse.json(updated);
}
