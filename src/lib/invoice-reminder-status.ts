import {
  daysUntilDue,
  reminderKindForDaysUntil,
  reminderSentField,
  type InvoiceReminderKind,
} from "@/lib/invoice-due-dates";

export type ReminderStepState = "sent" | "today" | "upcoming" | "missed" | "done";

export type ReminderStepSummary = {
  kind: InvoiceReminderKind;
  shortLabel: string;
  detail: string;
  state: ReminderStepState;
  badge: string;
};

export type InvoiceReminderSummary = {
  headline: string;
  steps: ReminderStepSummary[];
};

const REMINDER_META: Record<
  InvoiceReminderKind,
  { shortLabel: string; triggerDaysUntil: number; mailLabel: string }
> = {
  "7d": {
    shortLabel: "7 días antes",
    triggerDaysUntil: 7,
    mailLabel: "mail de 7 días antes",
  },
  "1d": {
    shortLabel: "1 día antes",
    triggerDaysUntil: 1,
    mailLabel: "mail de 1 día antes",
  },
  due: {
    shortLabel: "Día de vencimiento",
    triggerDaysUntil: 0,
    mailLabel: "mail del día de vencimiento",
  },
};

const REMINDER_ORDER: InvoiceReminderKind[] = ["7d", "1d", "due"];

export type InvoiceReminderInput = {
  status: string;
  dueAt: string | Date | null;
  reminder7dSentAt?: string | Date | null;
  reminder1dSentAt?: string | Date | null;
  reminderDueSentAt?: string | Date | null;
};

function sentAtFor(
  invoice: InvoiceReminderInput,
  kind: InvoiceReminderKind,
): Date | null {
  const raw =
    kind === "7d"
      ? invoice.reminder7dSentAt
      : kind === "1d"
        ? invoice.reminder1dSentAt
        : invoice.reminderDueSentAt;
  if (!raw) return null;
  return raw instanceof Date ? raw : new Date(raw);
}

function formatSentDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function daysLabel(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

function buildStep(
  invoice: InvoiceReminderInput,
  kind: InvoiceReminderKind,
  daysUntil: number,
): ReminderStepSummary {
  const meta = REMINDER_META[kind];
  const sentAt = sentAtFor(invoice, kind);

  if (sentAt) {
    return {
      kind,
      shortLabel: meta.shortLabel,
      state: "sent",
      badge: "Enviado",
      detail: `${meta.mailLabel} enviado el ${formatSentDate(sentAt)}`,
    };
  }

  if (daysUntil === meta.triggerDaysUntil) {
    return {
      kind,
      shortLabel: meta.shortLabel,
      state: "today",
      badge: "Hoy",
      detail: `Hoy se envía el ${meta.mailLabel}`,
    };
  }

  if (daysUntil > meta.triggerDaysUntil) {
    const wait = daysUntil - meta.triggerDaysUntil;
    return {
      kind,
      shortLabel: meta.shortLabel,
      state: "upcoming",
      badge: daysLabel(wait),
      detail: `${daysLabel(wait)} se envía el ${meta.mailLabel}`,
    };
  }

  return {
    kind,
    shortLabel: meta.shortLabel,
    state: "missed",
    badge: "No enviado",
    detail: `No se envió el ${meta.mailLabel} (pasó la fecha)`,
  };
}

export function buildInvoiceReminderSummary(
  invoice: InvoiceReminderInput,
  now = new Date(),
): InvoiceReminderSummary {
  if (invoice.status !== "pendiente") {
    return {
      headline: "No aplica (documento pagado)",
      steps: [],
    };
  }

  if (!invoice.dueAt) {
    return {
      headline: "Sin vencimiento — no hay recordatorios",
      steps: [],
    };
  }

  const dueAt =
    invoice.dueAt instanceof Date ? invoice.dueAt : new Date(`${String(invoice.dueAt).slice(0, 10)}T12:00:00Z`);
  const daysUntil = daysUntilDue(dueAt, now);
  const steps = REMINDER_ORDER.map((kind) => buildStep(invoice, kind, daysUntil));

  if (daysUntil < 0) {
    const sentCount = steps.filter((s) => s.state === "sent").length;
    const overdueDays = Math.abs(daysUntil);
    return {
      headline: `Vencida hace ${overdueDays} día${overdueDays === 1 ? "" : "s"} · ${sentCount}/3 recordatorios enviados`,
      steps,
    };
  }

  const todayKind = reminderKindForDaysUntil(daysUntil);
  if (todayKind) {
    const todayStep = steps.find((s) => s.kind === todayKind);
    if (todayStep?.state === "sent") {
      const next = steps.find((s) => s.state === "upcoming");
      if (next) {
        return {
          headline: `${todayStep.detail} · ${next.detail}`,
          steps,
        };
      }
      if (steps.every((s) => s.state === "sent")) {
        return {
          headline: "Los 3 recordatorios ya se enviaron",
          steps,
        };
      }
    }
    if (todayStep?.state === "today") {
      return { headline: todayStep.detail, steps };
    }
  }

  const nextUpcoming = steps.find((s) => s.state === "upcoming");
  if (nextUpcoming) {
    return { headline: nextUpcoming.detail, steps };
  }

  const sentSteps = steps.filter((s) => s.state === "sent");
  if (sentSteps.length === steps.length) {
    return { headline: "Los 3 recordatorios ya se enviaron", steps };
  }

  const missed = steps.filter((s) => s.state === "missed");
  if (missed.length > 0 && !nextUpcoming) {
    const nextMissed = missed[0];
    const stillPending = steps.find((s) => s.state === "upcoming" || s.state === "today");
    if (stillPending) {
      return { headline: stillPending.detail, steps };
    }
    return {
      headline: `${missed.length} recordatorio(s) no enviado(s) · vence ${daysLabel(daysUntil)}`,
      steps,
    };
  }

  return { headline: "Sin recordatorios programados", steps };
}

export function reminderSentAtValue(
  invoice: InvoiceReminderInput,
  kind: InvoiceReminderKind,
): string | null {
  const field = reminderSentField(kind);
  const key =
    field === "reminder7dSentAt"
      ? "reminder7dSentAt"
      : field === "reminder1dSentAt"
        ? "reminder1dSentAt"
        : "reminderDueSentAt";
  const raw = invoice[key as keyof InvoiceReminderInput];
  if (!raw) return null;
  return raw instanceof Date ? raw.toISOString() : String(raw);
}
