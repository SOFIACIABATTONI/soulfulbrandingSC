import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { z } from "zod";

const createSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  // "sena" | "final"
  type: z.enum(["sena", "final"]),
  total: z.number().positive(),
  // "pendiente" | "pagado"
  status: z.enum(["pendiente", "pagado"]).optional().default("pendiente"),
  notes: z.string().optional().default(""),
  issuedAt: z.string().optional(), // ISO date string
});

/** Genera el siguiente número de factura: "2026-001" */
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  if (!last) return `${prefix}001`;
  const seq = parseInt(last.number.slice(prefix.length), 10);
  return `${prefix}${String(seq + 1).padStart(3, "0")}`;
}

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const items = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
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
  const { issuedAt, ...rest } = parsed.data;
  const number = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      ...rest,
      number,
      issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  });
  return NextResponse.json({ ok: true, item: invoice }, { status: 201 });
}
