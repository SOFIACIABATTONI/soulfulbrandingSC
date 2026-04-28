"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@prisma/client";

// ── helpers ──────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  referido: "Referido",
  otros: "Otros",
};

const STATUS_LABELS: Record<string, string> = {
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

function statusPill(status: string) {
  if (status === "ganado")
    return (
      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-green-100 text-green-800">
        Ganado
      </span>
    );
  if (status === "perdido")
    return (
      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-red-100 text-red-700">
        Perdido
      </span>
    );
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{ background: "rgba(50,63,246,0.08)", color: "#323FF6" }}
    >
      Negociación
    </span>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "short" });
}

// ── tipos del formulario ──────────────────────────────────
const EMPTY_FORM = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: "identidad-de-marca",
  estimatedValue: "",
  source: "web",
  referredBy: "",
  status: "negociacion",
  notes: "",
};

// ── componente principal ──────────────────────────────────
export function LeadsManager() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterService, setFilterService] = useState("todos");
  const [filterSource, setFilterSource] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    const res = await fetch("/api/admin/leads", { credentials: "include" });
    if (res.ok) {
      const j = (await res.json()) as { items: Lead[] };
      setItems(j.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (filterStatus !== "todos" && r.status !== filterStatus) return false;
      if (filterService !== "todos" && r.service !== filterService) return false;
      if (filterSource !== "todos" && r.source !== filterSource) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.company.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, filterStatus, filterService, filterSource, search]);

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    }
  }

  if (loading)
    return (
      <p className="py-12 text-center text-sm text-neutral-500">Cargando leads…</p>
    );

  return (
    <div className="space-y-5">
      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o email…"
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="negociacion">Negociación</option>
          <option value="ganado">Ganado</option>
          <option value="perdido">Perdido</option>
        </select>
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
        >
          <option value="todos">Todos los servicios</option>
          <option value="identidad-de-marca">Identidad de marca</option>
          <option value="estrategia-visual">Estrategia visual</option>
          <option value="diseno-editorial">Diseño editorial</option>
        </select>
        <select
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="todos">Todas las fuentes</option>
          <option value="web">Web</option>
          <option value="referido">Referido</option>
          <option value="otros">Otros</option>
        </select>
        <span className="text-sm text-neutral-400 ml-1">
          {filtered.length} de {items.length}
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="ml-auto rounded px-4 py-2 text-sm font-medium text-white"
          style={{ background: "#0D0D0D" }}
        >
          + Agregar manual
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
              <th className="px-4 py-3">Nombre / Empresa</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Valor est.</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Notas</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-neutral-100 hover:bg-[#F9F3DB]/40 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[#0D0D0D]">{row.name}</div>
                  {row.company && (
                    <div className="text-xs text-neutral-400 mt-0.5">{row.company}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ background: "#0D0D0D", color: "#F9F3DB" }}
                  >
                    {SERVICE_LABELS[row.service] ?? row.service}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-[#0D0D0D]">
                  {row.estimatedValue ? `$${row.estimatedValue.toLocaleString("es-AR")}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {SOURCE_LABELS[row.source] ?? row.source}
                  {row.referredBy && (
                    <span className="block text-neutral-400">— {row.referredBy}</span>
                  )}
                </td>
                <td className="px-4 py-3">{statusPill(row.status)}</td>
                <td className="px-4 py-3 max-w-[180px]">
                  <span className="text-xs text-neutral-400 line-clamp-2">
                    {row.notes || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/leads/${row.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "#F03172" }}
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            No hay leads con estos filtros.
          </p>
        )}
      </div>

      {/* ── Modal nuevo lead ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(13,13,13,0.55)" }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div
              className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10"
            >
              <h2 className="font-serif text-lg italic">Nuevo lead</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
              >
                ×
              </button>
            </div>
            <form onSubmit={createLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre completo" required>
                  <input
                    required
                    className="fv"
                    placeholder="Valentina Rossi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Empresa / Marca">
                  <input
                    className="fv"
                    placeholder="Studio Rossi"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    required
                    type="email"
                    className="fv"
                    placeholder="valentina@..."
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    className="fv"
                    placeholder="+54 9 11..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Servicio">
                  <select
                    className="fv"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                  >
                    <option value="identidad-de-marca">Identidad de marca</option>
                    <option value="estrategia-visual">Estrategia visual</option>
                    <option value="diseno-editorial">Diseño editorial</option>
                  </select>
                </Field>
                <Field label="Valor estimado (USD)">
                  <input
                    type="number"
                    className="fv"
                    placeholder="3200"
                    value={form.estimatedValue}
                    onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                  />
                </Field>
                <Field label="Fuente">
                  <select
                    className="fv"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option value="web">Web</option>
                    <option value="referido">Referido</option>
                    <option value="otros">Otros</option>
                  </select>
                </Field>
                <Field label="Referido por">
                  <input
                    className="fv"
                    placeholder="Ana García"
                    value={form.referredBy}
                    onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Estado">
                    <select
                      className="fv"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="negociacion">Negociación</option>
                      <option value="ganado">Ganado</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Notas">
                    <textarea
                      className="fv w-full resize-y"
                      rows={3}
                      placeholder="Notas internas sobre este lead…"
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
                  {saving ? "Guardando…" : "Guardar lead"}
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
        .fv:focus {
          border-color: rgba(50,63,246,0.5);
          background: #fff;
        }
        select.fv { appearance: auto; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-[9px] font-medium uppercase tracking-widest"
        style={{ color: "rgba(13,13,13,0.42)" }}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// exportar constantes para reusar en LeadDetail
export { STATUS_LABELS, SERVICE_LABELS, SOURCE_LABELS };
