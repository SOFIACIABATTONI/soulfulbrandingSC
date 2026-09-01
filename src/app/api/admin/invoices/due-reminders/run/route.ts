import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth-api";
import { processInvoiceDueReminders } from "@/lib/process-invoice-due-reminders";
import { z } from "zod";

const bodySchema = z.object({
  dryRun: z.boolean().optional().default(false),
});

/** Ejecutar recordatorios manualmente desde el admin (pruebas en dev). */
export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const result = await processInvoiceDueReminders({ dryRun: parsed.data.dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin/invoice-due-reminders]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
