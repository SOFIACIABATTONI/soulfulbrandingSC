"use client";

import { useEffect, useState } from "react";

type TestimonialRow = {
  id: string;
  brand: string;
  body: string;
  sortOrder: number;
  published: boolean;
  projectSlug: string;
};

type PortfolioOption = { slug: string; title: string };

const emptyForm = {
  brand: "",
  body: "",
  projectSlug: "",
  published: true,
};

export function TestimonialsAdmin() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [portfolioOptions, setPortfolioOptions] = useState<PortfolioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials", { credentials: "include" });
    const j = (await res.json()) as { items?: TestimonialRow[]; portfolioOptions?: PortfolioOption[] };
    if (res.ok) {
      setItems(j.items ?? []);
      setPortfolioOptions(j.portfolioOptions ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTestimonial(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    const res = await fetch("/api/admin/testimonials", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      setForm(emptyForm);
      setMsg("Testimonio creado.");
      await load();
      return;
    }
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    setMsg(err?.error ?? "No se pudo crear.");
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setMsg(null);
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSavingId(null);
    if (res.ok) {
      setEditingId(null);
      setMsg("Guardado.");
      await load();
      return;
    }
    setMsg("No se pudo guardar.");
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  async function reorder(nextItems: TestimonialRow[]) {
    setReordering(true);
    setMsg(null);
    const res = await fetch("/api/admin/testimonials/reorder", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: nextItems.map((row) => row.id) }),
    });
    setReordering(false);
    if (res.ok) {
      setItems(nextItems);
      return;
    }
    setMsg("No se pudo guardar el orden.");
    await load();
  }

  async function move(id: string, dir: -1 | 1) {
    const index = items.findIndex((t) => t.id === id);
    if (index < 0) return;
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(index, 1);
    next.splice(swapIndex, 0, removed!);
    await reorder(next);
  }

  function startEdit(row: TestimonialRow) {
    setEditingId(row.id);
    setEditForm({
      brand: row.brand,
      body: row.body,
      projectSlug: row.projectSlug,
      published: row.published,
    });
  }

  if (loading) return <p className="p-8 text-neutral-600">Cargando testimonios…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="font-serif text-3xl text-brand-navy">Testimonios</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Carrusel en <code className="text-xs">/portfolio</code> (desktop) y desplegable en fichas de caso cuando
          vinculás un slug. Usá ↑ ↓ para definir el orden del carrusel. Los nuevos se agregan al final.
        </p>
      </div>

      {reordering && <p className="mt-4 text-sm text-neutral-500">Guardando orden…</p>}

      <ul className="mt-8 space-y-4">
        {items.map((row, index) => (
          <li key={row.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            {editingId === row.id ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Marca</label>
                <input
                  className="w-full rounded-md border border-neutral-300 px-3 py-2"
                  value={editForm.brand}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
                <label className="block text-sm font-medium">Texto</label>
                <textarea
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  rows={8}
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                />
                <label className="block text-sm font-medium">Ficha de portfolio (opcional)</label>
                <select
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  value={editForm.projectSlug}
                  onChange={(e) => setEditForm({ ...editForm, projectSlug: e.target.value })}
                >
                  <option value="">— Sin vincular —</option>
                  {portfolioOptions.map((opt) => (
                    <option key={opt.slug} value={opt.slug}>
                      {opt.title} ({opt.slug})
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.published}
                    onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                  />
                  Publicado en carrusel
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit(row.id)}
                    disabled={savingId === row.id}
                    className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingId === row.id ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-sans text-lg font-bold text-brand-magenta">{row.brand}</h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      Orden {index + 1}
                      {row.projectSlug ? ` · Ficha: ${row.projectSlug}` : ""}
                      {!row.published ? " · Oculto" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => void move(row.id, -1)}
                      disabled={index === 0 || reordering}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                      aria-label="Subir"
                      title="Subir en el carrusel"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(row.id, 1)}
                      disabled={index === items.length - 1 || reordering}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                      aria-label="Bajar"
                      title="Bajar en el carrusel"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="rounded border border-neutral-300 px-2 py-1 text-xs"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(row.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-neutral-700">{row.body}</p>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void createTestimonial(e)} className="mt-10 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Nuevo testimonio</h2>
        <label className="block text-sm font-medium">Marca</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          required
        />
        <label className="block text-sm font-medium">Texto</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          rows={8}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          required
        />
        <label className="block text-sm font-medium">Ficha de portfolio (opcional)</label>
        <select
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={form.projectSlug}
          onChange={(e) => setForm({ ...form, projectSlug: e.target.value })}
        >
          <option value="">— Sin vincular —</option>
          {portfolioOptions.map((opt) => (
            <option key={opt.slug} value={opt.slug}>
              {opt.title} ({opt.slug})
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Publicado en carrusel
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creando…" : "Agregar testimonio"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-neutral-700">{msg}</p>}
    </div>
  );
}
