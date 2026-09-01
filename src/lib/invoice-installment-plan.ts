export type InstallmentIntervalUnit = "days" | "months";

export type InstallmentPlanLine = {
  index: number;
  total: number;
  dueAt: string;
  issuedAt: string;
};

export type BuildInstallmentPlanInput = {
  count: number;
  totalAmount: number;
  firstDueDate: string;
  intervalValue: number;
  intervalUnit: InstallmentIntervalUnit;
  issuedAt?: string;
};

/** Suma días o meses a una fecha YYYY-MM-DD (mediodía UTC, estable para vencimientos). */
export function addIntervalToDateKey(
  dateKey: string,
  intervalValue: number,
  unit: InstallmentIntervalUnit,
): string {
  const base = new Date(`${dateKey}T12:00:00Z`);
  if (unit === "days") {
    base.setUTCDate(base.getUTCDate() + intervalValue);
  } else {
    base.setUTCMonth(base.getUTCMonth() + intervalValue);
  }
  return base.toISOString().slice(0, 10);
}

/** Reparte el monto en cuotas iguales; la última absorbe centavos. */
export function buildInstallmentPlan(input: BuildInstallmentPlanInput): InstallmentPlanLine[] {
  const count = Math.max(1, Math.floor(input.count));
  const total = Math.round(Math.max(0, input.totalAmount) * 100) / 100;
  if (total <= 0) return [];

  const basePer = Math.floor((total / count) * 100) / 100;
  const remainder = Math.round((total - basePer * count) * 100) / 100;
  const issuedAt = input.issuedAt?.trim() || new Date().toISOString().slice(0, 10);

  const lines: InstallmentPlanLine[] = [];
  for (let i = 0; i < count; i++) {
    let dueAt = input.firstDueDate;
    for (let step = 0; step < i; step++) {
      dueAt = addIntervalToDateKey(dueAt, input.intervalValue, input.intervalUnit);
    }
    const amount = i === count - 1 ? Math.round((basePer + remainder) * 100) / 100 : basePer;
    lines.push({ index: i + 1, total: amount, dueAt, issuedAt });
  }
  return lines;
}
