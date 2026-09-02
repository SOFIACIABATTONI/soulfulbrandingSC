import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";

const updateSchema = z.object({
  brand: z.string().min(1).max(200).optional(),
  body: z.string().max(20000).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
  projectSlug: z.string().max(200).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const updated = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(data.brand !== undefined ? { brand: data.brand.trim() } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.projectSlug !== undefined ? { projectSlug: data.projectSlug.trim() } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
