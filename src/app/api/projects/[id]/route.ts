import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(2000).optional(),
  description: z.string().max(20000).optional(),
  imageUrl: z.string().max(2000).optional(),
  category: z.string().max(200).optional(),
  order: z.number().int().optional(),
  published: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const newSlug = parsed.data.slug;
  if (newSlug && newSlug !== existing.slug) {
    const clash = await prisma.project.findFirst({
      where: { slug: newSlug, id: { not: id } },
    });
    if (clash) {
      return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 409 });
    }
    await prisma.portfolioGalleryItem.updateMany({
      where: { slug: existing.slug },
      data: { slug: newSlug },
    });
    await prisma.clientProject.updateMany({
      where: { portfolioSlug: existing.slug },
      data: { portfolioSlug: newSlug },
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
