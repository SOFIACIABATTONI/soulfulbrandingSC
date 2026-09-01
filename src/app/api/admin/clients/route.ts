import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const items = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      _count: { select: { projects: true, invoices: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const existing = await prisma.client.findFirst({
    where: { email: { equals: parsed.data.email.trim(), mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `Ya existe un cliente con ese email (${existing.name}). Abrí su ficha y usá «Fusionar con otro cliente» si es un duplicado.`,
        existingClientId: existing.id,
      },
      { status: 409 },
    );
  }
  const client = await prisma.client.create({ data: { ...parsed.data, email: parsed.data.email.trim() } });
  return NextResponse.json({ ok: true, item: client }, { status: 201 });
}
