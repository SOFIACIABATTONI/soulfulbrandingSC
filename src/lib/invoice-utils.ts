/** Etiquetas de documentos de cobro (tipo interno sigue siendo sena | final). */
export const INVOICE_TYPE_LABELS: Record<string, string> = {
  sena: "Recibo de seña",
  final: "Factura final",
};

export const INVOICE_TYPE_SHORT: Record<string, string> = {
  sena: "Recibo seña",
  final: "Factura final",
};

export type InvoiceLike = {
  id?: string;
  type: string;
  status: string;
  total: number;
  projectId?: string | null;
};

export function getInvoiceDocumentTitle(type: string): string {
  return INVOICE_TYPE_LABELS[type] ?? type;
}

/** Suma de montos ya pagados en un proyecto. */
export function sumPaidInvoices(
  invoices: InvoiceLike[],
  projectId: string,
): number {
  return invoices
    .filter((i) => i.projectId === projectId && i.status === "pagado")
    .reduce((acc, i) => acc + i.total, 0);
}

/** Suma de montos pendientes en un proyecto. */
export function sumPendingInvoices(
  invoices: InvoiceLike[],
  projectId: string,
): number {
  return invoices
    .filter((i) => i.projectId === projectId && i.status === "pendiente")
    .reduce((acc, i) => acc + i.total, 0);
}

/** Total comprometido (pagado + pendiente) en un proyecto, con override opcional para edición. */
export function projectInvoiceCommittedTotal(
  invoices: InvoiceLike[],
  projectId: string,
  override?: { invoiceId?: string; total?: number; status?: string },
): number {
  let sum = 0;
  for (const inv of invoices) {
    if (inv.projectId !== projectId) continue;
    let total = inv.total;
    if (override?.invoiceId && inv.id === override.invoiceId) {
      if (override.total !== undefined) total = override.total;
    }
    sum += total;
  }
  if (override && !override.invoiceId && override.total != null) {
    sum += override.total;
  }
  return Math.round(sum * 100) / 100;
}

/** Saldo sugerido para factura final. */
export function suggestedFinalTotal(
  projectValue: number,
  invoices: InvoiceLike[],
  projectId: string,
): number {
  const paid = sumPaidInvoices(invoices, projectId);
  return Math.max(0, Math.round((projectValue - paid) * 100) / 100);
}

/** Saldo pendiente por emitir (valor del proyecto menos todo lo ya documentado). */
export function suggestedRemainingTotal(
  projectValue: number,
  invoices: InvoiceLike[],
  projectId: string,
): number {
  const committed = projectInvoiceCommittedTotal(invoices, projectId);
  return Math.max(0, Math.round((projectValue - committed) * 100) / 100);
}

export function projectHasSenaInvoice(
  invoices: InvoiceLike[],
  projectId: string,
): boolean {
  return invoices.some((i) => i.type === "sena" && i.projectId === projectId);
}

export function projectHasFinalInvoice(
  invoices: InvoiceLike[],
  projectId: string,
  excludeInvoiceId?: string,
): boolean {
  return invoices.some(
    (i) =>
      i.type === "final" &&
      i.projectId === projectId &&
      i.id !== excludeInvoiceId,
  );
}

export function projectSenaIsPaid(
  invoices: InvoiceLike[],
  projectId: string,
): boolean {
  return invoices.some(
    (i) => i.type === "sena" && i.status === "pagado" && i.projectId === projectId,
  );
}

export type InvoiceCreateValidation = {
  ok: true;
} | {
  ok: false;
  error: string;
};

export type InvoiceCreateOptions = {
  newTotal?: number;
  newStatus?: "pendiente" | "pagado";
  excludeInvoiceId?: string;
};

function formatEur(amount: number): string {
  return amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Reglas de negocio al crear o modificar recibos / facturas de un proyecto. */
export function validateInvoiceCreate(
  type: "sena" | "final",
  projectId: string | undefined,
  projectValue: number | undefined,
  invoices: InvoiceLike[],
  opts?: InvoiceCreateOptions,
): InvoiceCreateValidation {
  if (!projectId) {
    return { ok: true };
  }

  if (type === "final" && projectHasFinalInvoice(invoices, projectId, opts?.excludeInvoiceId)) {
    return {
      ok: false,
      error: "Este proyecto ya tiene una factura final.",
    };
  }

  if (projectValue == null || projectValue <= 0) {
    return { ok: true };
  }

  const relevant = invoices.filter((i) => i.projectId === projectId);

  const paid = sumPaidInvoices(relevant, projectId);
  const newTotal = opts?.newTotal ?? 0;

  if (paid >= projectValue && newTotal > 0 && !opts?.excludeInvoiceId) {
    return {
      ok: false,
      error: "El proyecto ya está totalmente cobrado.",
    };
  }

  const committed = projectInvoiceCommittedTotal(relevant, projectId, {
    invoiceId: opts?.excludeInvoiceId,
    total: newTotal > 0 ? newTotal : undefined,
  });

  if (committed > projectValue + 0.001) {
    return {
      ok: false,
      error: `El total de recibos y facturas (€${formatEur(committed)} EUR) supera el valor del proyecto (€${formatEur(projectValue)} EUR).`,
    };
  }

  return { ok: true };
}

export function invoiceOnboardingPaymentDone(
  invoices: { type: string; status: string; projectId?: string | null }[],
  projectId?: string,
): boolean {
  const match = (i: { type: string; status: string; projectId?: string | null }) =>
    i.status === "pagado" && (!projectId || i.projectId === projectId);

  return invoices.some(
    (i) => match(i) && (i.type === "sena" || i.type === "final"),
  );
}
