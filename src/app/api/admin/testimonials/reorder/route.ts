import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const ids = parsed.data.ids;
  const existing = await prisma.testimonial.findMany({ select: { id: true } });
  if (existing.length !== ids.length) {
    return NextResponse.json({ error: "La lista de IDs no coincide con los testimonios actuales." }, { status: 400 });
  }

  const existingIds = new Set(existing.map((row) => row.id));
  if (!ids.every((id) => existingIds.has(id))) {
    return NextResponse.json({ error: "Hay IDs inválidos en el orden." }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.testimonial.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
