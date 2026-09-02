"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@prisma/client";
import { ImageField } from "@/components/admin/ImageField";
import { AdminUploadProgress } from "@/components/admin/AdminUploadProgress";
import { slugifyPortfolioTitle } from "@/lib/portfolio-slug";
import { filterPortfolioGalleryExcludeCover } from "@/lib/portfolio-gallery-db";
import { uploadPortfolioImageFile, type UploadProgressEvent } from "@/lib/admin-client-upload";
import { reloadAdminPage } from "@/lib/admin-reload";

type GalleryItem = {
  id: string;
  slug: string;
  url: string;
  fileName: string;
  mime: string;
  sortOrder: number;
};

type Props = { slug: string };

export function PortfolioCaseEditor({ slug }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<UploadProgressEvent | null>(null);
  const [galleryUploadFileName, setGalleryUploadFileName] = useState("");
  const [galleryUploadFileSize, setGalleryUploadFileSize] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?all=1", { credentials: "include" });
      if (!res.ok) throw new Error("projects fetch failed");
      const list = (await res.json()) as Project[];
      if (!Array.isArray(list)) throw new Error("invalid projects response");
      const found = list.find((p) => p.slug === slug) ?? null;
      setProject(found);

      if (found) {
        const gRes = await fetch(`/api/admin/portfolio-gallery/${encodeURIComponent(slug)}`, {
          credentials: "include",
        });
        if (gRes.ok) {
          const j = (await gRes.json()) as { items: GalleryItem[] };
          setGallery(Array.isArray(j.items) ? j.items : []);
        }
      } else {
        setGallery([]);
      }
    } catch (err) {
      console.error("[PortfolioCaseEditor] load", err);
      setMsg("No se pudo cargar el editor. Recargá la página.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProject(next?: Partial<Project>) {
    if (!project) return;
    setSaving(true);
    setMsg(null);
    const body = { ...project, ...next };
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        description: body.description,
        imageUrl: body.imageUrl,
        category: body.category,
        order: body.order,
        published: body.published,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = (await res.json()) as Project;
      setProject(updated);

      const cover = updated.imageUrl?.trim();
      if (cover) {
        const dupes = gallery.filter((g) => g.url.trim() === cover);
        if (dupes.length > 0) {
          await Promise.all(
            dupes.map((g) =>
              fetch(`/api/admin/portfolio-gallery/item/${g.id}`, {
                method: "DELETE",
                credentials: "include",
              }),
            ),
          );
          await load();
        }
      }

      setMsg("Guardado.");
      if (updated.slug !== slug) {
        window.location.href = `/admin/projects/${encodeURIComponent(updated.slug)}/publicar`;
      }
    } else {
      setMsg("No se pudo guardar.");
    }
  }

  async function saveCoverUrl(url: string): Promise<boolean> {
    if (!project) return false;
    const body = {
      title: project.title,
      slug: project.slug,
      excerpt: project.excerpt,
      description: project.description,
      imageUrl: url,
      category: project.category,
      order: project.order,
      published: project.published,
    };
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      console.error("[saveCoverUrl]", res.status, j?.error);
      return false;
    }
    const updated = (await res.json()) as Project;
    setProject(updated);
    return true;
  }

  async function addGalleryFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploadingGallery(true);
    setMsg(null);
    let added = 0;
    const errors: string[] = [];
    try {
      for (const file of list) {
        setGalleryUploadProgress({ loaded: 0, total: file.size, percentage: 0, phase: "upload" });
        setGalleryUploadFileName(file.name);
        setGalleryUploadFileSize(file.size);

        let uploaded: { url: string; mime: string };
        try {
          uploaded = await uploadPortfolioImageFile(file, (event) => setGalleryUploadProgress(event));
        } catch (err) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : "error"}`);
          continue;
        }

        const { url, mime } = uploaded;
        if (project?.imageUrl?.trim() === url) {
          setMsg("Esa imagen ya es la portada. Elegí otra para la galería del caso.");
          continue;
        }

        setGalleryUploadProgress({ loaded: file.size, total: file.size, percentage: 95, phase: "save" });
        const res = await fetch(`/api/admin/portfolio-gallery/${encodeURIComponent(slug)}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            fileName: file.name,
            mime: mime || file.type || "image/jpeg",
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null;
          errors.push(`${file.name}: ${j?.error ?? "no se guardó"}`);
          continue;
        }
        added += 1;
      }
      if (added > 0) {
        reloadAdminPage();
        return;
      }
      if (errors.length > 0) {
        setMsg(
          (added > 0 ? `${added} ok. ` : "") +
            `No se subieron: ${errors.slice(0, 2).join("; ")}${errors.length > 2 ? "…" : ""}`,
        );
      }
    } catch {
      setMsg(added > 0 ? "Algunos archivos no se pudieron subir." : "No se pudo subir el archivo.");
      if (added > 0) await load();
    } finally {
      setUploadingGallery(false);
      setGalleryUploadProgress(null);
    }
  }

  async function removeGalleryItem(id: string) {
    if (!confirm("¿Quitar esta imagen de la galería?")) return;
    await fetch(`/api/admin/portfolio-gallery/item/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  }

  async function moveGalleryItem(id: string, dir: -1 | 1) {
    if (!project) return;
    const visible = filterPortfolioGalleryExcludeCover(gallery, project.imageUrl);
    const idx = visible.findIndex((g) => g.id === id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= visible.length) return;

    const reordered = [...visible];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    const hidden = gallery.filter((g) => !visible.some((v) => v.id === g.id));
    setGallery([...reordered, ...hidden]);

    await Promise.all(
      reordered.map((item, order) =>
        fetch(`/api/admin/portfolio-gallery/item/${item.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: order }),
        }),
      ),
    );
  }

  if (loading) return <p className="p-8 text-neutral-600">Cargando editor…</p>;
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-neutral-700">No se encontró el proyecto «{slug}».</p>
        <Link href="/admin/projects" className="mt-4 inline-block text-sm text-brand-blue hover:underline">
          ← Volver a trabajos publicados
        </Link>
      </div>
    );
  }

  const canPublish = Boolean(project.title?.trim() && project.slug?.trim() && project.imageUrl?.trim());
  const suggestedSlug = slugifyPortfolioTitle(project.title);
  const caseImages = filterPortfolioGalleryExcludeCover(gallery, project.imageUrl);
  const checklist = [
    { ok: Boolean(project.imageUrl?.trim()), label: "Portada para la grilla /portfolio" },
    { ok: caseImages.length > 0, label: "Imágenes en la ficha pública" },
    { ok: Boolean(project.excerpt?.trim() || project.description?.trim()), label: "Texto del caso (opcional)" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-magenta">Brand&apos;s — editor</p>
          <h1 className="mt-2 font-serif text-3xl text-brand-navy">{project.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">/portfolio/{project.slug}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/portfolio/${project.slug}`}
            target="_blank"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Preview {project.published ? "público" : "(solo si está publicado)"}
          </Link>
          <Link href="/admin/projects" className="text-sm text-neutral-600 hover:underline">
            ← Lista
          </Link>
        </div>
      </div>

      {msg ? <p className="mt-4 text-sm text-neutral-700">{msg}</p> : null}

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold text-brand-navy">Checklist editorial</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className={c.ok ? "text-emerald-600" : "text-neutral-400"}>{c.ok ? "✓" : "○"}</span>
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h2 className="font-semibold text-brand-navy">Portada y datos del caso</h2>
        <div>
          <label className="block text-sm font-medium">Nombre de la marca (título)</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">URL pública (slug)</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-mono"
            value={project.slug}
            onChange={(e) =>
              setProject({
                ...project,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              })
            }
            placeholder="ailen-sampo"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Quedará en{" "}
            <span className="font-mono text-brand-navy">
              /portfolio/{project.slug || suggestedSlug || "nombre-marca"}
            </span>
            {suggestedSlug && project.slug !== suggestedSlug ? (
              <>
                {" "}
                ·{" "}
                <button
                  type="button"
                  className="text-brand-blue hover:underline"
                  onClick={() => setProject({ ...project, slug: suggestedSlug })}
                >
                  Usar sugerido: {suggestedSlug}
                </button>
              </>
            ) : null}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium">Categoría</label>
          <input
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={project.category}
            onChange={(e) => setProject({ ...project, category: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Resumen (card / intro)</label>
          <textarea
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            rows={2}
            value={project.excerpt}
            onChange={(e) => setProject({ ...project, excerpt: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Descripción (ficha)</label>
          <textarea
            className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            rows={5}
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
          />
        </div>
        <ImageField
          label="Portada"
          value={project.imageUrl}
          onChange={(url) => setProject({ ...project, imageUrl: url })}
          onSave={saveCoverUrl}
          helpText="Solo la card en /portfolio. En la ficha del caso se muestran las imágenes de abajo."
        />
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium">Orden en grilla</label>
            <input
              type="number"
              className="mt-1 w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              value={project.order}
              onChange={(e) => setProject({ ...project, order: Number(e.target.value) })}
            />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={project.published}
              onChange={(e) => setProject({ ...project, published: e.target.checked })}
            />
            Publicado en Brand&apos;s
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveProject()}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navyDark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar borrador"}
        </button>
        <button
          type="button"
          disabled={saving || !canPublish}
          onClick={() => void saveProject({ published: true })}
          className="ml-2 rounded-md bg-brand-magenta px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Publicar en Brand&apos;s
        </button>
        {!canPublish ? (
          <p className="text-xs text-neutral-500">Para publicar necesitás título, slug y portada.</p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold text-brand-navy">Medios del caso</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Imágenes (JPG, PNG, WEBP, GIF) y videos (MP4, WebM). La portada va aparte (arriba) y no se
          repite en esta sección.
        </p>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-neutral-300 px-4 py-3 text-sm hover:bg-neutral-50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
            multiple
            className="sr-only"
            disabled={uploadingGallery}
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) void addGalleryFiles(files);
              e.target.value = "";
            }}
          />
          {uploadingGallery ? "Subiendo…" : "+ Agregar imágenes o videos"}
        </label>

        {uploadingGallery && galleryUploadProgress ? (
          <AdminUploadProgress
            fileName={galleryUploadFileName}
            fileSize={galleryUploadFileSize}
            progress={galleryUploadProgress}
            savingLabel="Guardando imagen en el caso…"
            className="mt-3"
          />
        ) : null}

        {caseImages.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Todavía no hay imágenes. Subí las piezas que quieras mostrar.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            <p className="border-b border-neutral-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-navy/55">
              Vista previa del orden publicado
            </p>
            <ul className="flex flex-col">
              {caseImages.map((g, i) => (
                <li key={g.id} className="group relative border-b border-neutral-200 last:border-b-0">
                  {g.mime.startsWith("video/") ? (
                    <video
                      src={g.url}
                      controls
                      muted
                      playsInline
                      className="block h-auto w-full bg-black"
                      preload="metadata"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={g.url} alt="" className="block h-auto w-full bg-white" loading="lazy" />
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent p-3">
                    <span className="rounded bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-brand-navy">
                      {i + 1} / {caseImages.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded bg-white/95 px-2 py-1 text-xs font-semibold text-brand-navy hover:bg-white disabled:opacity-40"
                        disabled={i === 0}
                        onClick={() => void moveGalleryItem(g.id, -1)}
                        aria-label="Subir imagen"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded bg-white/95 px-2 py-1 text-xs font-semibold text-brand-navy hover:bg-white disabled:opacity-40"
                        disabled={i === caseImages.length - 1}
                        onClick={() => void moveGalleryItem(g.id, 1)}
                        aria-label="Bajar imagen"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded bg-white/95 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-white"
                        onClick={() => void removeGalleryItem(g.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
