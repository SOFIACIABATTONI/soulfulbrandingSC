import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const DEFAULT_PHASES = {
  onboarding: "pending",
  prebrief: "pending",
  narrativa: "pending",
  identidad: "pending",
  manual: "pending",
};

const createSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  service: z.enum(["identidad-de-marca", "estrategia-visual", "diseno-editorial"]),
  value: z.number().positive(),
  status: z
    .enum(["onboarding", "diseno", "implementacion", "entregado"])
    .optional()
    .default("onboarding"),
  startDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional().default(""),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const items = await prisma.clientProject.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { invoices: true } },
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
  const { startDate, deliveryDate, ...rest } = parsed.data;
  const project = await prisma.clientProject.create({
    data: {
      ...rest,
      phases: DEFAULT_PHASES,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(deliveryDate ? { deliveryDate: new Date(deliveryDate) } : {}),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
    },
  });
  return NextResponse.json({ ok: true, item: project }, { status: 201 });
}
