import { prisma } from "@/lib/prisma";
import { invoicePublicPdfUrl } from "@/lib/invoice-public-url";
import {
  daysUntilDue,
  reminderKindForDaysUntil,
  reminderSentField,
  type InvoiceReminderKind,
} from "@/lib/invoice-due-dates";
import { sendInvoiceDueReminderEmail } from "@/lib/send-invoice-due-reminder-email";

export type ProcessInvoiceDueRemindersResult = {
  scanned: number;
  dueToday: number;
  sent: Array<{ invoiceId: string; number: string; kind: InvoiceReminderKind }>;
  skipped: Array<{ invoiceId: string; number: string; reason: string }>;
  dryRun: boolean;
};

type InvoiceRow = {
  id: string;
  number: string;
  type: string;
  total: number;
  dueAt: Date | null;
  publicToken: string | null;
  reminder7dSentAt: Date | null;
  reminder1dSentAt: Date | null;
  reminderDueSentAt: Date | null;
  client: { name: string; email: string };
  project: { title: string } | null;
};

function alreadySent(invoice: InvoiceRow, kind: InvoiceReminderKind): boolean {
  const field = reminderSentField(kind);
  return invoice[field] != null;
}

export async function processInvoiceDueReminders(options?: {
  dryRun?: boolean;
  now?: Date;
}): Promise<ProcessInvoiceDueRemindersResult> {
  const dryRun = options?.dryRun ?? false;
  const now = options?.now ?? new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      status: "pendiente",
      dueAt: { not: null },
    },
    select: {
      id: true,
      number: true,
      type: true,
      total: true,
      dueAt: true,
      publicToken: true,
      reminder7dSentAt: true,
      reminder1dSentAt: true,
      reminderDueSentAt: true,
      client: { select: { name: true, email: true } },
      project: { select: { title: true } },
    },
  });

  const result: ProcessInvoiceDueRemindersResult = {
    scanned: invoices.length,
    dueToday: 0,
    sent: [],
    skipped: [],
    dryRun,
  };

  for (const invoice of invoices) {
    if (!invoice.dueAt) continue;
    if (invoice.type !== "sena" && invoice.type !== "final") {
      result.skipped.push({
        invoiceId: invoice.id,
        number: invoice.number,
        reason: "tipo no soportado",
      });
      continue;
    }

    const daysUntil = daysUntilDue(invoice.dueAt, now);
    if (daysUntil === 0) result.dueToday += 1;

    const kind = reminderKindForDaysUntil(daysUntil);
    if (!kind) continue;

    if (alreadySent(invoice, kind)) {
      result.skipped.push({
        invoiceId: invoice.id,
        number: invoice.number,
        reason: `recordatorio ${kind} ya enviado`,
      });
      continue;
    }

    if (!invoice.client.email?.trim()) {
      result.skipped.push({
        invoiceId: invoice.id,
        number: invoice.number,
        reason: "cliente sin email",
      });
      continue;
    }

    if (dryRun) {
      result.sent.push({ invoiceId: invoice.id, number: invoice.number, kind });
      continue;
    }

    const emailed = await sendInvoiceDueReminderEmail({
      toEmail: invoice.client.email.trim(),
      toName: invoice.client.name,
      invoiceNumber: invoice.number,
      invoiceType: invoice.type,
      total: invoice.total,
      dueAt: invoice.dueAt,
      projectTitle: invoice.project?.title,
      pdfUrl: invoice.publicToken
        ? invoicePublicPdfUrl(invoice.publicToken)
        : undefined,
      reminderKind: kind,
    });

    if (!emailed) {
      result.skipped.push({
        invoiceId: invoice.id,
        number: invoice.number,
        reason: "fallo envío Resend",
      });
      continue;
    }

    const sentField = reminderSentField(kind);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { [sentField]: now },
    });

    result.sent.push({ invoiceId: invoice.id, number: invoice.number, kind });
  }

  return result;
}
