"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ContactMessage } from "@prisma/client";
import {
  CONTACT_FORM_KEYS,
  CONTACT_FORM_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type ContactFormKey,
  type LeadStatus,
  isContactFormKey,
} from "@/lib/contact-form-keys";
import { cn } from "@/lib/cn";
import { buildLeadBudgetDraft } from "@/lib/lead-budget-template";

type Props = { initialItems: ContactMessage[] };

function formatDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formLabel(key: string): string {
  if (isContactFormKey(key)) return CONTACT_FORM_LABELS[key];
  return key;
}

export function LeadsManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [filterForm, setFilterForm] = useState<ContactFormKey | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "todos">("todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [budgetOpenId, setBudgetOpenId] = useState<string | null>(null);
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [copiedBudgetId, setCopiedBudgetId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((row) => {
      if (filterForm !== "todos" && row.formKey !== filterForm) return false;
      if (filterStatus !== "todos" && row.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterForm, filterStatus]);

  async function updateStatus(id: string, status: LeadStatus) {
    setBusyId(id);
    const res = await fetch(`/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) return;
    const data = (await res.json()) as { item: ContactMessage };
    setItems((prev) => prev.map((r) => (r.id === id ? data.item : r)));
  }

  useEffect(() => {
    if (budgetOpenId && budgetOpenId !== openId) {
      setBudgetOpenId(null);
    }
  }, [budgetOpenId, openId]);

  function toggleDetails(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  function toggleBudgetEditor(row: ContactMessage) {
    setBudgetDrafts((current) => ({
      ...current,
      [row.id]: current[row.id] ?? buildLeadBudgetDraft(row),
    }));
    setBudgetOpenId((current) => (current === row.id ? null : row.id));
  }

  function updateBudgetDraft(id: string, value: string) {
    setBudgetDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  }

  async function copyBudget(id: string) {
    const text = budgetDrafts[id];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedBudgetId(id);
    window.setTimeout(() => {
      setCopiedBudgetId((current) => (current === id ? null : current));
    }, 1600);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600">Formulario</label>
          <select
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value as ContactFormKey | "todos")}
          >
            <option value="todos">Todos</option>
            {CONTACT_FORM_KEYS.map((k) => (
              <option key={k} value={k}>
                {CONTACT_FORM_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600">Estado</label>
          <select
            className="mt-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as LeadStatus | "todos")}
          >
            <option value="todos">Todos</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-neutral-500">
          {filtered.length} de {items.length} leads
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Formulario</th>
              <th className="px-3 py-3">Sección / etapa</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3 w-24">Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <Fragment key={row.id}>
                <tr className="border-b border-neutral-100 hover:bg-neutral-50/80">
                  <td className="whitespace-nowrap px-3 py-2.5 text-neutral-700">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2.5 font-medium">{row.name}</td>
                  <td className="max-w-[180px] truncate px-3 py-2.5 text-brand-blue">
                    <a href={`mailto:${row.email}`} className="hover:underline">
                      {row.email}
                    </a>
                  </td>
                  <td className="max-w-[220px] px-3 py-2.5 text-xs leading-snug text-neutral-800">
                    {formLabel(row.formKey)}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-2.5 text-xs text-neutral-600">
                    {row.stageTitle || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      disabled={busyId === row.id}
                      className={cn(
                        "max-w-[130px] rounded border border-neutral-300 bg-white px-2 py-1 text-xs",
                        busyId === row.id && "opacity-60",
                      )}
                      value={LEAD_STATUSES.includes(row.status as LeadStatus) ? row.status : "nuevo"}
                      onChange={(e) => updateStatus(row.id, e.target.value as LeadStatus)}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-blue hover:underline"
                      onClick={() => toggleDetails(row.id)}
                    >
                      {openId === row.id ? "Ocultar" : "Ver"}
                    </button>
                  </td>
                </tr>
                {openId === row.id && (
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <td colSpan={7} className="px-3 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-neutral-500">Contenido del mensaje</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-brand-blue/20 bg-white px-3 py-1.5 text-xs font-medium text-brand-blue transition hover:bg-brand-blue/5"
                            onClick={() => toggleBudgetEditor(row)}
                          >
                            {budgetOpenId === row.id ? "Ocultar presupuesto" : "Generar presupuesto"}
                          </button>
                          <a
                            href={`mailto:${row.email}`}
                            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                          >
                            Responder por email
                          </a>
                        </div>
                      </div>
                      <pre className="mt-2 max-h-[min(60vh,420px)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-neutral-200 bg-white p-3 text-xs text-brand-navy">
                        {row.message}
                      </pre>

                      {budgetOpenId === row.id && (
                        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                                Editor de presupuesto
                              </p>
                              <p className="mt-1 text-sm text-neutral-600">
                                Se carga con el nombre del cliente y el contexto del lead para que lo ajustes antes de enviarlo.
                              </p>
                            </div>
                            <button
                              type="button"
                              className="rounded-md bg-brand-navy px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-brand-navyDark"
                              onClick={() => void copyBudget(row.id)}
                            >
                              {copiedBudgetId === row.id ? "Copiado" : "Copiar texto"}
                            </button>
                          </div>

                          <textarea
                            className="mt-4 min-h-[320px] w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm leading-relaxed text-brand-navy outline-none focus:border-brand-blue"
                            value={budgetDrafts[row.id] ?? ""}
                            onChange={(e) => updateBudgetDraft(row.id, e.target.value)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No hay leads con estos filtros.</p>
        )}
      </div>
    </div>
  );
}
