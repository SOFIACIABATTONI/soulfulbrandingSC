"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ── tipos ──────────────────────────────────────────────────
type InvoiceItem = {
  id: string;
  number: string;
  type: string;
  total: number;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  notes: string;
  client: { id: string; name: string; company: string };
  project: { id: string; title: string } | null;
};

type ClientOption = { id: string; name: string; company: string };

// ── helpers ────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  sena: "Seña",
  final: "Final",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "short" });
}

function StatusPill({ status }: { status: string }) {
  const isPaid = status === "pagado";
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={
        isPaid
          ? { background: "#e3f2e3", color: "#1a6b1a" }
          : { background: "rgba(255,160,0,0.12)", color: "#b45000" }
      }
    >
      {isPaid ? "Pagada" : "Pendiente"}
    </span>
  );
}

const EMPTY_FORM = {
  clientId: "",
  type: "sena",
  total: "",
  status: "pendiente",
  notes: "",
  issuedAt: new Date().toISOString().slice(0, 10),
};

// ── componente principal ───────────────────────────────────
export function InvoicesManager({
  initialClientId,
}: {
  initialClientId?: string;
}) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterType, setFilterType] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, clientId: initialClientId ?? "" });

  async function load() {
    const [invRes, cliRes] = await Promise.all([
      fetch("/api/admin/invoices", { credentials: "include" }),
      fetch("/api/admin/clients", { credentials: "include" }),
    ]);
    if (invRes.ok) {
      const j = (await invRes.json()) as { items: InvoiceItem[] };
      setItems(j.items);
    }
    if (cliRes.ok) {
      const j = (await cliRes.json()) as { items: ClientOption[] };
      setClients(j.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filterStatus !== "todos" && r.status !== filterStatus) return false;
      if (filterType !== "todos" && r.type !== filterType) return false;
      if (initialClientId && r.client.id !== initialClientId) return false;
      return true;
    });
  }, [items, filterStatus, filterType, initialClientId]);

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        total: Number(form.total),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      setForm({ ...EMPTY_FORM, clientId: initialClientId ?? "" });
      await load();
    }
  }

  async function markPaid(id: string) {
    setMarkingPaid(id);
    await fetch(`/api/admin/invoices/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pagado" }),
    });
    setMarkingPaid(null);
    await load();
  }

  const totalPendiente = filtered
    .filter((i) => i.status === "pendiente")
    .reduce((acc, i) => acc + i.total, 0);

  if (loading)
    return <p className="py-12 text-center text-sm text-neutral-500">Cargando facturas…</p>;

  return (
    <div className="space-y-4">
      {/* ── Resumen ── */}
      {filtered.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div
            className="rounded border px-4 py-2.5 text-sm"
            style={{ borderColor: "rgba(13,13,13,0.1)", background: "#fff" }}
          >
            <span style={{ color: "rgba(13,13,13,0.42)" }}>Total facturas: </span>
            <span className="font-medium">{filtered.length}</span>
          </div>
          {totalPendiente > 0 && (
            <div
              className="rounded border px-4 py-2.5 text-sm"
              style={{ borderColor: "rgba(255,160,0,0.3)", background: "#fff4e0" }}
            >
              <span style={{ color: "#b45000" }}>Por cobrar: </span>
              <span className="font-medium" style={{ color: "#b45000" }}>
                ${totalPendiente.toLocaleString("es-AR")} USD
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Filtros + botón ── */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagadas</option>
        </select>
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="todos">Todos los tipos</option>
          <option value="sena">Seña</option>
          <option value="final">Final</option>
        </select>
        <span className="text-sm text-neutral-400">{filtered.length} de {items.length}</span>
        <button
          onClick={() => {
            setForm({ ...EMPTY_FORM, clientId: initialClientId ?? "" });
            setModalOpen(true);
          }}
          className="ml-auto rounded px-4 py-2 text-sm font-medium text-white"
          style={{ background: "#0D0D0D" }}
        >
          + Nueva factura
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead
            className="border-b border-neutral-200 text-left text-[11px] font-medium uppercase tracking-widest"
            style={{ background: "#F9F3DB", color: "rgba(13,13,13,0.42)" }}
          >
            <tr>
              <th className="px-4 py-3">Número</th>
              {!initialClientId && <th className="px-4 py-3">Cliente</th>}
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Emisión</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 hover:bg-[#F9F3DB]/40 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">{row.number}</td>
                {!initialClientId && (
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${row.client.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "#0D0D0D" }}
                    >
                      {row.client.name}
                    </Link>
                    {row.client.company && (
                      <div className="text-xs text-neutral-400 mt-0.5">{row.client.company}</div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {row.project?.title ?? <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ background: "#0D0D0D", color: "#F9F3DB" }}
                  >
                    {TYPE_LABELS[row.type] ?? row.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  ${row.total.toLocaleString("es-AR")} USD
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.issuedAt)}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.paidAt)}
                </td>
                <td className="px-4 py-3">
                  {row.status === "pendiente" && (
                    <button
                      onClick={() => void markPaid(row.id)}
                      disabled={markingPaid === row.id}
                      className="text-xs font-medium hover:underline disabled:opacity-50"
                      style={{ color: "#1a6b1a" }}
                    >
                      {markingPaid === row.id ? "…" : "Marcar pagada"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            {items.length === 0
              ? "Todavía no hay facturas."
              : "No hay facturas con estos filtros."}
          </p>
        )}
      </div>

      {/* ── Modal nueva factura ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(13,13,13,0.55)" }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-lg italic">Nueva factura</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
              >
                ×
              </button>
            </div>
            <form onSubmit={createInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {!initialClientId && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <Field label="Cliente" required>
                      <select
                        required
                        className="fv"
                        value={form.clientId}
                        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      >
                        <option value="">Seleccionar cliente…</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.company ? ` — ${c.company}` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
                <Field label="Tipo" required>
                  <select
                    className="fv"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="sena">Seña (50%)</option>
                    <option value="final">Factura final</option>
                  </select>
                </Field>
                <Field label="Total (USD)" required>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="fv"
                    placeholder="1600"
                    value={form.total}
                    onChange={(e) => setForm({ ...form, total: e.target.value })}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    className="fv"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagada</option>
                  </select>
                </Field>
                <Field label="Fecha de emisión">
                  <input
                    type="date"
                    className="fv"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Notas">
                    <textarea
                      className="fv w-full resize-y"
                      rows={2}
                      placeholder="Notas internas sobre esta factura…"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#0D0D0D" }}
                >
                  {saving ? "Generando…" : "Generar factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .fv {
          width: 100%;
          padding: 7px 10px;
          font-size: 13px;
          border: 1px solid rgba(13,13,13,0.15);
          border-radius: 2px;
          background: #F9F3DB;
          color: #0D0D0D;
          outline: none;
        }
        .fv:focus { border-color: rgba(50,63,246,0.5); background: #fff; }
        select.fv { appearance: auto; }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.42)" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
