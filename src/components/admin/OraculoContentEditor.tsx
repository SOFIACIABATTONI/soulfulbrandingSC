"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import type { OraculoMediaUrls, OraculoPageContentData } from "@/lib/oraculo-page-content";
import { brandUi } from "@/lib/brand-ui";

const MEDIA_FIELDS: { key: keyof OraculoMediaUrls; label: string }[] = [
  { key: "bienvenidaAudio", label: "Audio de bienvenida" },
  { key: "salpicadoCartas", label: "GIF salpicado de cartas" },
  { key: "footerImage", label: "Imagen footer" },
  { key: "florNegra", label: "Flor negra (ícono)" },
  { key: "flagAr", label: "Bandera Argentina (pago)" },
  { key: "flagEs", label: "Bandera España (pago)" },
];

function blockLabel(block: OraculoBlock, index: number): string {
  switch (block.kind) {
    case "title":
      return `#${index + 1} Título`;
    case "sub_header":
      return `#${index + 1} Subtítulo`;
    case "sub_sub_header":
      return `#${index + 1} Subtítulo (h4)`;
    case "text":
      return `#${index + 1} Texto`;
    case "bulleted_list":
      return `#${index + 1} Viñeta`;
    case "image":
      return `#${index + 1} Imagen`;
    case "callout_image":
      return `#${index + 1} Imagen destacada`;
    case "video":
      return `#${index + 1} Video (pie de foto)`;
    case "audio":
      return `#${index + 1} Audio (usa URL global)`;
    case "payment_card":
      return `#${index + 1} Tarjeta de pago`;
    case "form":
      return `#${index + 1} Formulario de compra`;
    case "spacer":
      return `#${index + 1} Espacio`;
    default:
      return `#${index + 1}`;
  }
}

function isEditableBlock(block: OraculoBlock): boolean {
  return !["payment_card", "form", "spacer", "audio", "title"].includes(block.kind);
}

async function uploadOraculoFile(file: File): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/admin/oraculo-media-upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error || "Error al subir");
  }
  return json.url;
}

export function OraculoContentEditor() {
  const [data, setData] = useState<OraculoPageContentData | null>(null);
  const [fromDatabase, setFromDatabase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [openBlocks, setOpenBlocks] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/oraculo-content", { credentials: "include" });
      const json = (await res.json()) as {
        data?: OraculoPageContentData;
        fromDatabase?: boolean;
        error?: string;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "No se pudo cargar");
      }
      setData(json.data);
      setFromDatabase(Boolean(json.fromDatabase));
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error al cargar" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateBlock(index: number, next: OraculoBlock) {
    setData((prev) => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      blocks[index] = next;
      return { ...prev, blocks };
    });
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/oraculo-content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      setFromDatabase(true);
      setMessage({ type: "ok", text: "Guardado. Los cambios ya están en /oraculo." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDefaultsFixed() {
    if (!confirm("¿Restaurar al contenido base (como en el código)? Esto guarda en la base de datos.")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/oraculo-content/reset", {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { data?: OraculoPageContentData; error?: string };
      if (!res.ok || !json.data) throw new Error(json.error || "Error");
      setData(json.data);
      setFromDatabase(true);
      setMessage({ type: "ok", text: "Contenido base restaurado y guardado." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Cargando Oráculo…</p>;
  }

  if (!data) {
    return <p className="text-sm text-red-600">No se pudo cargar el contenido.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-brand-navy">Oráculo Raíz — contenido</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Editá textos, video e imágenes de la landing.{" "}
            {fromDatabase ? (
              <span className="text-brand-navy">Versión guardada en base de datos.</span>
            ) : (
              <span>Mostrando plantilla por defecto (aún no guardaste cambios).</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/oraculo"
            target="_blank"
            className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-brand-navy hover:bg-neutral-50"
          >
            Ver página →
          </Link>
          <button
            type="button"
            onClick={() => void handleResetDefaultsFixed()}
            disabled={saving}
            className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Restaurar base
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            style={{ background: brandUi.accent }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "ok" ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Video de presentación</h2>
        <p className="text-xs text-neutral-600">
          URL pública (MP4 recomendado). Si está vacío, se usa la variable de entorno o el archivo local en desarrollo.
        </p>
        <input
          type="url"
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="https://…/presentacion.mp4"
          value={data.presentationVideoUrl}
          onChange={(e) => setData({ ...data, presentationVideoUrl: e.target.value })}
        />
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-brand-navy underline">
          Subir video (MP4, máx. 48 MB)
          <input
            type="file"
            accept="video/mp4,video/webm,.mp4,.webm"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await uploadOraculoFile(file);
                setData((d) => (d ? { ...d, presentationVideoUrl: url } : d));
                setMessage({ type: "ok", text: "Video subido. Guardá para publicar." });
              } catch (err) {
                setMessage({ type: "err", text: err instanceof Error ? err.message : "Error" });
              }
              e.target.value = "";
            }}
          />
        </label>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Medios globales</h2>
        {MEDIA_FIELDS.map(({ key, label }) => (
          <div key={key} className="border-t border-neutral-100 pt-4 first:border-0 first:pt-0">
            <label className="block text-xs font-medium text-neutral-700 mb-1">{label}</label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1.5 text-xs"
                value={data.media[key]}
                onChange={(e) =>
                  setData({
                    ...data,
                    media: { ...data.media, [key]: e.target.value },
                  })
                }
              />
              <label className="cursor-pointer rounded border border-neutral-300 px-2 py-1.5 text-[10px] hover:bg-neutral-50">
                Subir
                <input
                  type="file"
                  accept={key === "bienvenidaAudio" ? "audio/*,.m4a,.mp3" : "image/*"}
                  className="hidden"
                  onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadOraculoFile(file);
                      setData((d) =>
                        d ? { ...d, media: { ...d.media, [key]: url } } : d,
                      );
                    } catch (err) {
                      setMessage({ type: "err", text: err instanceof Error ? err.message : "Error" });
                    }
                    ev.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Bloques de la página</h2>
        <p className="text-xs text-neutral-600 mb-4">
          HTML permitido en textos (<code className="text-[10px]">&lt;strong&gt;</code>, enlaces, etc.). Tarjeta de pago y formulario no se editan acá.
        </p>
        {data.blocks.map((block, index) => {
          const open = openBlocks[index] ?? false;
          const editable = isEditableBlock(block);
          return (
            <div key={index} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-neutral-50"
                onClick={() => setOpenBlocks((o) => ({ ...o, [index]: !open }))}
              >
                <span className="font-medium text-brand-navy">{blockLabel(block, index)}</span>
                <span className="text-neutral-400">{open ? "▾" : "▸"}</span>
              </button>
              {open && editable && (
                <div className="border-t border-neutral-100 px-4 py-3 space-y-3">
                  {(block.kind === "sub_header" || block.kind === "sub_sub_header") && (
                    <textarea
                      className="w-full min-h-[120px] rounded border border-neutral-300 px-2 py-1.5 text-xs font-mono"
                      value={block.lines.join("\n")}
                      onChange={(e) =>
                        updateBlock(index, {
                          ...block,
                          lines: e.target.value.split("\n"),
                        } as OraculoBlock)
                      }
                    />
                  )}
                  {block.kind === "text" && (
                    <textarea
                      className="w-full min-h-[100px] rounded border border-neutral-300 px-2 py-1.5 text-xs"
                      value={block.html}
                      onChange={(e) => updateBlock(index, { ...block, html: e.target.value })}
                    />
                  )}
                  {block.kind === "bulleted_list" && (
                    <input
                      className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      value={block.text}
                      onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                    />
                  )}
                  {block.kind === "video" && (
                    <input
                      className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      placeholder="Pie de foto bajo el video"
                      value={block.caption}
                      onChange={(e) => updateBlock(index, { ...block, caption: e.target.value })}
                    />
                  )}
                  {(block.kind === "image" || block.kind === "callout_image") && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {block.src && !block.src.endsWith(".bin") && (
                        <img src={block.src} alt="" className="max-h-32 rounded border object-contain" />
                      )}
                      <input
                        className="w-full rounded border border-neutral-300 px-2 py-1.5 text-xs"
                        placeholder="URL de imagen"
                        value={block.src}
                        onChange={(e) => updateBlock(index, { ...block, src: e.target.value })}
                      />
                      {block.kind === "image" && (
                        <input
                          className="w-full rounded border border-neutral-300 px-2 py-1.5 text-xs"
                          placeholder="Texto alternativo (alt)"
                          value={block.alt ?? ""}
                          onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                        />
                      )}
                      <label className="inline-block cursor-pointer text-xs text-brand-navy underline">
                        Subir imagen
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadOraculoFile(file);
                              updateBlock(index, { ...block, src: url });
                            } catch (err) {
                              setMessage({
                                type: "err",
                                text: err instanceof Error ? err.message : "Error",
                              });
                            }
                            ev.target.value = "";
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
              {open && !editable && (
                <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
                  Bloque fijo del diseño (no editable).
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
