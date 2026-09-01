import { NextResponse } from "next/server";
import { processInvoiceDueReminders } from "@/lib/process-invoice-due-reminders";

function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("[cron/invoice-due-reminders] CRON_SECRET no configurado");
    return false;
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Vercel Cron: recordatorios de facturas pendientes (7d / 1d / día de vencimiento). */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    const result = await processInvoiceDueReminders({ dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/invoice-due-reminders]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
