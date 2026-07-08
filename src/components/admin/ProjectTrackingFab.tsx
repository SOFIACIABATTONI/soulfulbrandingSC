"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { brandUi } from "@/lib/brand-ui";

type PhaseSummary = {
  key: string;
  title: string;
  state: string;
  startDate: string;
  endDate: string;
  owner: string;
};

type ProjectTrackingFabProps = {
  projectTitle: string;
  projectId: string;
  client: { id: string; name: string };
  startDate: string | null;
  deliveryDate: string | null;
  savingProjectDates: boolean;
  phases: PhaseSummary[];
  stateLabels: Record<string, string>;
  stateColors: Record<string, { bg: string; color: string }>;
  invoices: { id: string; number: string; total: number; status: string }[];
  totalFacturado: number;
  porCobrar: number;
  toDateInputValue: (d: string | null) => string;
  onProjectDateChange: (field: "startDate" | "deliveryDate", value: string) => void;
  onSaveProjectDates: () => void;
};

export function ProjectTrackingFab({
  projectTitle,
  projectId,
  client,
  startDate,
  deliveryDate,
  savingProjectDates,
  phases,
  stateLabels,
  stateColors,
  invoices,
  totalFacturado,
  porCobrar,
  toDateInputValue,
  onProjectDateChange,
  onSaveProjectDates,
}: ProjectTrackingFabProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [projectId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar seguimiento"
          className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out
          bottom-4 right-4 md:bottom-6 md:right-6
          ${open ? "w-[min(100vw-2rem,380px)]" : "w-auto"}`}
      >
        <div
          className={`overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all duration-300
            ${open ? "max-h-[min(78vh,640px)] opacity-100 mb-3" : "max-h-0 opacity-0 mb-0 pointer-events-none"}`}
          style={{ borderColor: brandUi.border }}
          role="dialog"
          aria-hidden={!open}
          aria-label="Seguimiento del proyecto"
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 border-b"
            style={{ borderColor: brandUi.border, background: brandUi.navySoft }}
          >
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                Seguimiento
              </p>
              <p className="text-sm font-medium truncate" style={{ color: brandUi.text }}>
                {projectTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full w-8 h-8 text-lg leading-none hover:bg-white/80"
              style={{ color: brandUi.textMuted }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto p-4 space-y-4 max-h-[calc(min(78vh,640px)-56px)]">
            <div className="rounded-xl border border-dashed p-3 space-y-3" style={{ borderColor: brandUi.border }}>
              <p className="text-xs font-medium" style={{ color: brandUi.text }}>
                Fechas del proyecto
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-medium" style={{ color: brandUi.textMuted }}>
                    Inicio
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                    style={{ borderColor: brandUi.border }}
                    value={toDateInputValue(startDate)}
                    onChange={(e) => onProjectDateChange("startDate", e.target.value)}
                    onBlur={() => onSaveProjectDates()}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium" style={{ color: brandUi.textMuted }}>
                    Entrega
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                    style={{ borderColor: brandUi.border }}
                    value={toDateInputValue(deliveryDate)}
                    onChange={(e) => onProjectDateChange("deliveryDate", e.target.value)}
                    onBlur={() => onSaveProjectDates()}
                  />
                </label>
              </div>
              {savingProjectDates && (
                <p className="text-[10px]" style={{ color: brandUi.blue }}>
                  Guardando…
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: brandUi.text }}>
                Estado por etapa
              </p>
              {phases.map((ph) => {
                const stc = stateColors[ph.state] ?? stateColors.pending;
                return (
                  <div
                    key={ph.key}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: brandUi.border }}
                  >
                    <span className="truncate" style={{ color: brandUi.text }}>
                      {ph.title}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: stc.bg, color: stc.color }}
                    >
                      {stateLabels[ph.state] ?? ph.state}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: brandUi.border }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium" style={{ color: brandUi.text }}>
                  Facturación
                </p>
                <Link
                  href={`/admin/facturas?clientId=${client.id}&projectId=${projectId}`}
                  className="text-[10px] font-medium hover:underline"
                  style={{ color: brandUi.accent }}
                >
                  + Factura
                </Link>
              </div>
              {invoices.length === 0 ? (
                <p className="text-[11px]" style={{ color: brandUi.textMuted }}>
                  Sin facturas vinculadas.
                </p>
              ) : (
                <>
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex justify-between text-[11px] gap-2">
                      <span className="font-mono" style={{ color: brandUi.textMuted }}>
                        {inv.number}
                      </span>
                      <span>
                        ${inv.total.toLocaleString("es-AR")}{" "}
                        <span style={{ color: inv.status === "pagado" ? "#1a6b1a" : "#b45000" }}>
                          {inv.status === "pagado" ? "pagada" : "pend."}
                        </span>
                      </span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between text-xs pt-2 border-t"
                    style={{ borderColor: brandUi.border }}
                  >
                    <span style={{ color: brandUi.textMuted }}>Facturado</span>
                    <span className="font-medium">${totalFacturado.toLocaleString("es-AR")} USD</span>
                  </div>
                  {porCobrar > 0 && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#b45000" }}>Por cobrar</span>
                      <span className="font-medium" style={{ color: "#b45000" }}>
                        ${porCobrar.toLocaleString("es-AR")} USD
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Link
              href={`/admin/clientes/${client.id}`}
              className="block text-center rounded-xl border px-3 py-2.5 text-xs font-medium hover:bg-neutral-50"
              style={{ borderColor: brandUi.border, color: brandUi.blue }}
            >
              Ver ficha de {client.name} →
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: open ? brandUi.text : brandUi.accent }}
          aria-expanded={open}
          aria-label={open ? "Cerrar seguimiento del proyecto" : "Abrir seguimiento del proyecto"}
        >
          <span className="text-base leading-none" aria-hidden>
            {open ? "×" : "◎"}
          </span>
          <span className="hidden sm:inline">{open ? "Cerrar" : "Seguimiento"}</span>
        </button>
      </div>
    </>
  );
}
