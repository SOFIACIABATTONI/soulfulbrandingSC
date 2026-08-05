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

/** Saldo sugerido para factura final. */
export function suggestedFinalTotal(
  projectValue: number,
  invoices: InvoiceLike[],
  projectId: string,
): number {
  const paid = sumPaidInvoices(invoices, projectId);
  return Math.max(0, Math.round((projectValue - paid) * 100) / 100);
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
): boolean {
  return invoices.some((i) => i.type === "final" && i.projectId === projectId);
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

/** Reglas de negocio al crear recibo / factura final. */
export function validateInvoiceCreate(
  type: "sena" | "final",
  projectId: string | undefined,
  projectValue: number | undefined,
  invoices: InvoiceLike[],
): InvoiceCreateValidation {
  if (!projectId) {
    return { ok: true };
  }

  if (type === "sena") {
    if (projectHasSenaInvoice(invoices, projectId)) {
      return { ok: false, error: "Este proyecto ya tiene un recibo de seña." };
    }
    return { ok: true };
  }

  if (projectHasFinalInvoice(invoices, projectId)) {
    return { ok: false, error: "Este proyecto ya tiene una factura final." };
  }

  const hasSena = projectHasSenaInvoice(invoices, projectId);
  if (hasSena && !projectSenaIsPaid(invoices, projectId)) {
    return {
      ok: false,
      error: "Primero debe pagarse el recibo de seña antes de emitir la factura final.",
    };
  }

  if (projectValue != null && projectValue > 0) {
    const paid = sumPaidInvoices(invoices, projectId);
    if (paid >= projectValue) {
      return {
        ok: false,
        error: "El proyecto ya está totalmente cobrado.",
      };
    }
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
