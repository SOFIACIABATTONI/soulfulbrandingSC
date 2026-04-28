"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Client } from "@prisma/client";

// ── tipos ──────────────────────────────────────────────────
type ClientWithCount = Client & {
  _count: { projects: number; invoices: number };
};

// ── helpers ────────────────────────────────────────────────
function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "short" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const EMPTY_FORM = {
  name: "",
  company: "",
  email: "",
  phone: "",
  notes: "",
};

// ── componente principal ───────────────────────────────────
export function ClientsManager() {
  const [items, setItems] = useState<ClientWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    const res = await fetch("/api/admin/clients", { credentials: "include" });
    if (res.ok) {
      const j = (await res.json()) as { items: ClientWithCount[] };
      setItems(j.items);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [items, search]);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      <p className="py-12 text-center text-sm text-neutral-500">
        Cargando clientes…
      </p>
    );

  return (
    <div className="space-y-5">
      {/* ── Barra de herramientas ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o email…"
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm w-64 focus:outline-none focus:border-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-neutral-400 ml-1">
          {filtered.length} de {items.length}
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="ml-auto rounded px-4 py-2 text-sm font-medium text-white"
          style={{ background: "#0D0D0D" }}
        >
          + Nuevo cliente
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
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3 text-center">Proyectos</th>
              <th className="px-4 py-3 text-center">Facturas</th>
              <th className="px-4 py-3">Alta</th>
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
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-white"
                      style={{ background: "#F03172" }}
                    >
                      {initials(row.name)}
                    </div>
                    <div>
                      <div className="font-medium text-[#0D0D0D]">
                        {row.name}
                      </div>
                      {row.company && (
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {row.company}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{row.email}</td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  {row.phone || "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background:
                        row._count.projects > 0
                          ? "rgba(50,63,246,0.08)"
                          : "rgba(13,13,13,0.05)",
                      color:
                        row._count.projects > 0
                          ? "#323FF6"
                          : "rgba(13,13,13,0.35)",
                    }}
                  >
                    {row._count.projects}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background:
                        row._count.invoices > 0
                          ? "rgba(240,49,114,0.08)"
                          : "rgba(13,13,13,0.05)",
                      color:
                        row._count.invoices > 0
                          ? "#F03172"
                          : "rgba(13,13,13,0.35)",
                    }}
                  >
                    {row._count.invoices}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400 whitespace-nowrap">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clientes/${row.id}`}
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
            {items.length === 0
              ? "Todavía no hay clientes. Los leads convertidos aparecen aquí."
              : "No hay clientes con esa búsqueda."}
          </p>
        )}
      </div>

      {/* ── Modal nuevo cliente ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(13,13,13,0.55)" }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-lg rounded bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-lg italic">Nuevo cliente</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xl text-neutral-400 hover:text-neutral-700 leading-none px-1"
              >
                ×
              </button>
            </div>
            <form onSubmit={createClient} className="p-5 space-y-4">
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
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    required
                    type="email"
                    className="fv"
                    placeholder="valentina@..."
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    className="fv"
                    placeholder="+54 9 11..."
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Notas internas">
                    <textarea
                      className="fv w-full resize-y"
                      rows={3}
                      placeholder="Notas sobre esta clienta…"
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
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
                  {saving ? "Guardando…" : "Guardar cliente"}
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
