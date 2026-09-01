export const INVOICE_REMINDER_TIMEZONE = "America/Argentina/Buenos_Aires";

export type InvoiceReminderKind = "7d" | "1d" | "due";

export const INVOICE_REMINDER_DAYS_BEFORE: Record<InvoiceReminderKind, number> = {
  "7d": 7,
  "1d": 1,
  due: 0,
};

/** Clave de calendario YYYY-MM-DD en zona horaria Argentina. */
export function calendarDateKey(date: Date, timeZone = INVOICE_REMINDER_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addCalendarDays(dateKey: string, days: number): string {
  const base = new Date(`${dateKey}T12:00:00`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function daysUntilDue(dueAt: Date, now = new Date()): number {
  const dueKey = calendarDateKey(dueAt);
  const todayKey = calendarDateKey(now);
  const dueMs = new Date(`${dueKey}T12:00:00Z`).getTime();
  const todayMs = new Date(`${todayKey}T12:00:00Z`).getTime();
  return Math.round((dueMs - todayMs) / 86_400_000);
}

export function formatDueDateLabel(dueAt: Date): string {
  return dueAt.toLocaleDateString("es-AR", {
    dateStyle: "long",
    timeZone: INVOICE_REMINDER_TIMEZONE,
  });
}

export function reminderKindForDaysUntil(daysUntil: number): InvoiceReminderKind | null {
  if (daysUntil === 7) return "7d";
  if (daysUntil === 1) return "1d";
  if (daysUntil === 0) return "due";
  return null;
}

export function reminderSentField(
  kind: InvoiceReminderKind,
): "reminder7dSentAt" | "reminder1dSentAt" | "reminderDueSentAt" {
  if (kind === "7d") return "reminder7dSentAt";
  if (kind === "1d") return "reminder1dSentAt";
  return "reminderDueSentAt";
}
