import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  service: z.enum([
    "identidad-de-marca",
    "estrategia-visual",
    "diseno-editorial",
  ]),
  estimatedValue: z.number().optional(),
  source: z.enum(["web", "referido", "otros"]).optional().default("web"),
  referredBy: z.string().optional().default(""),
  status: z
    .enum(["negociacion", "ganado", "perdido"])
    .optional()
    .default("negociacion"),
  notes: z.string().optional().default(""),
  fromContactMessage: z.string().optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const items = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
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
  const lead = await prisma.lead.create({ data: parsed.data });
  return NextResponse.json({ ok: true, item: lead }, { status: 201 });
}
