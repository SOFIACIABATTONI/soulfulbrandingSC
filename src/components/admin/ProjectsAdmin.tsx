"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@prisma/client";
import { ImageField } from "@/components/admin/ImageField";

export function ProjectsAdmin() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    description: "",
    imageUrl: "",
    category: "",
    order: 0,
    published: false,
  });

  async function load() {
    const res = await fetch("/api/projects?all=1", { credentials: "include" });
    const j = (await res.json()) as Project[];
    if (res.ok) setItems(j);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        slug: form.slug || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      }),
    });
    setCreating(false);
    if (res.ok) {
      setForm({
        title: "",
        slug: "",
        excerpt: "",
        description: "",
        imageUrl: "",
        category: "",
        order: 0,
        published: false,
      });
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  }

  if (loading) return <p className="p-8 text-neutral-600">Cargando proyectos…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-brand-navy md:text-4xl">Proyectos</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Elegí un proyecto para abrir el panel de entregas y fases, o creá uno nuevo.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-brand-blue hover:underline">
          ← Volver al panel
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-10 text-center text-sm text-neutral-600">
          Todavía no hay proyectos. Usá el formulario de abajo para crear el primero.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-brand-blue/25 hover:shadow-md"
            >
              <Link href={`/admin/projects/${encodeURIComponent(p.slug)}`} className="group block flex-1">
                <div className="relative aspect-[16/10] bg-neutral-100">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs pueden ser externas o blob sin remotePatterns
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs text-neutral-500">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-brand-navy group-hover:text-brand-blue">{p.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    /portfolio/{p.slug} · {p.published ? "publicado" : "borrador"}
                  </p>
                  {p.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{p.excerpt}</p>
                  ) : null}
                  <span className="mt-3 inline-flex text-sm font-medium text-brand-blue group-hover:underline">
                    Abrir panel de entregas →
                  </span>
                </div>
              </Link>
              <div className="space-y-3 border-t border-neutral-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/portfolio/${p.slug}`}
                    className="text-xs font-medium text-neutral-600 hover:text-brand-navy"
                    target="_blank"
                  >
                    Ver sitio
                  </Link>
                  <button
                    type="button"
                    className="ml-auto text-xs font-medium text-red-700 hover:underline"
                    onClick={() => void remove(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
                <ProjectInlineEdit project={p} onSaved={load} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14 rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl text-brand-navy">Nuevo proyecto</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Los datos de portfolio (título, slug, textos e imagen) se gestionan aquí. El panel de fases se abre desde cada
            tarjeta.
          </p>
        </div>

        <form onSubmit={createProject} className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Título</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Slug (url)</label>
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                placeholder="auto desde título si vacío"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Categoría</label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Resumen</label>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Descripción (detalle)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <ImageField label="Imagen" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium">Orden</label>
              <input
                type="number"
                className="mt-1 w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publicado
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navyDark disabled:opacity-60"
          >
            {creating ? "Creando…" : "Crear proyecto"}
          </button>
        </form>
      </section>
    </div>
  );
}

function ProjectInlineEdit({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState(project);

  async function save() {
    setSaving(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: local.title,
        slug: local.slug,
        excerpt: local.excerpt,
        description: local.description,
        imageUrl: local.imageUrl,
        category: local.category ?? "",
        order: local.order,
        published: local.published,
      }),
    });
    setSaving(false);
    setOpen(false);
    onSaved();
  }

  if (!open) {
    return (
      <button type="button" className="text-xs font-medium text-brand-blue hover:underline" onClick={() => setOpen(true)}>
        Editar datos
      </button>
    );
  }

  return (
    <div className="mt-3 w-full space-y-3 border-t border-neutral-100 pt-3">
      <input
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={local.title}
        onChange={(e) => setLocal({ ...local, title: e.target.value })}
      />
      <input
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={local.slug}
        onChange={(e) => setLocal({ ...local, slug: e.target.value })}
      />
      <input
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        placeholder="Categoría"
        value={local.category}
        onChange={(e) => setLocal({ ...local, category: e.target.value })}
      />
      <textarea
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        rows={2}
        value={local.excerpt}
        onChange={(e) => setLocal({ ...local, excerpt: e.target.value })}
      />
      <textarea
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        rows={4}
        value={local.description}
        onChange={(e) => setLocal({ ...local, description: e.target.value })}
      />
      <ImageField label="Imagen" value={local.imageUrl} onChange={(url) => setLocal({ ...local, imageUrl: url })} />
      <div className="flex flex-wrap gap-4">
        <input
          type="number"
          className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          value={local.order}
          onChange={(e) => setLocal({ ...local, order: Number(e.target.value) })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={local.published}
            onChange={(e) => setLocal({ ...local, published: e.target.checked })}
          />
          Publicado
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          className="rounded-md bg-brand-navy px-3 py-1.5 text-sm text-white hover:bg-brand-navyDark"
          onClick={() => void save()}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="text-sm text-neutral-600 hover:underline" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
