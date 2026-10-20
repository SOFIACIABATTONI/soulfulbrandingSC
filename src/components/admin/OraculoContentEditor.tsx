"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import type { OraculoMediaUrls, OraculoPageContentData } from "@/lib/oraculo-page-content";
import { brandUi } from "@/lib/brand-ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type TabId = "media" | "text" | "images" | "payment";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "media", label: "Video y audio", hint: "Presentación y bienvenida" },
  { id: "text", label: "Textos", hint: "Por secciones de la página" },
  { id: "images", label: "Imágenes", hint: "Hero, galería y footer" },
  { id: "payment", label: "Precios y pago", hint: "Argentina y España" },
];

function PaymentFormField({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "url";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-brand-navy">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-neutral-500">{hint}</span>}
      <input
        type={type}
        className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const MEDIA_ICONS: { key: keyof OraculoMediaUrls; label: string; hint: string }[] = [
  { key: "florNegra", label: "Flor negra", hint: "Ícono del formulario y pago" },
  { key: "flagAr", label: "Bandera AR", hint: "Métodos de pago Argentina" },
  { key: "flagEs", label: "Bandera ES", hint: "Métodos de pago España" },
  { key: "salpicadoCartas", label: "Salpicado de cartas", hint: "GIF decorativo" },
  { key: "footerImage", label: "Footer", hint: "Imagen al pie de la landing" },
];

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

function imageBlockTitle(block: OraculoBlock, index: number): string {
  if (block.kind !== "image" && block.kind !== "callout_image") return `Imagen ${index + 1}`;
  if (block.kind === "image" && block.alt?.trim()) return block.alt.slice(0, 48);
  if (block.src.includes("oraculo-raiz") || block.src.includes("img-07")) return "Hero (GIF principal)";
  if (block.src.includes("footer")) return "Imagen en cuerpo — footer";
  if (block.kind === "callout_image") return "Imagen destacada";
  return `Imagen en la página`;
}

type TextSection = { title: string; items: { index: number; block: OraculoBlock }[] };

function buildTextSections(blocks: OraculoBlock[]): TextSection[] {
  const sections: TextSection[] = [];
  let current: TextSection = { title: "Apertura", items: [] };

  const pushCurrent = () => {
    if (current.items.length > 0) sections.push(current);
  };

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (
      block.kind === "spacer" ||
      block.kind === "payment_card" ||
      block.kind === "form" ||
      block.kind === "title" ||
      block.kind === "audio" ||
      block.kind === "image" ||
      block.kind === "callout_image" ||
      block.kind === "video"
    ) {
      continue;
    }

    if (block.kind === "sub_header" || block.kind === "sub_sub_header") {
      pushCurrent();
      const title = block.lines.filter((l) => l.trim()).join(" ").slice(0, 72) || "Sección";
      current = { title, items: [{ index, block }] };
      continue;
    }

    current.items.push({ index, block });
  }
  pushCurrent();
  return sections;
}

function OraculoMediaField({
  label,
  hint,
  value,
  accept,
  onChange,
  onUploadError,
}: {
  label: string;
  hint?: string;
  value: string;
  accept: string;
  onChange: (url: string) => void;
  onUploadError: (msg: string) => void;
}) {
  const isAudio = accept.includes("audio");
  const isVideo = accept.includes("video");
  const showImg = value && !isAudio && !isVideo && !value.endsWith(".bin");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-navy">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>}
        </div>
        <label
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: brandUi.accent }}
        >
          Subir archivo
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                onChange(await uploadOraculoFile(file));
              } catch (err) {
                onUploadError(err instanceof Error ? err.message : "Error al subir");
              }
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {showImg && (
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="mx-auto max-h-36 object-contain" />
        </div>
      )}
      {isAudio && value && <audio controls className="mt-3 w-full" src={value} preload="metadata" />}
      {isVideo && value && (
        <video controls className="mt-3 w-full max-h-48 rounded bg-black" src={value} preload="metadata" />
      )}
      <input
        type="url"
        className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-xs"
        placeholder="O pegá una URL pública…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function OraculoContentEditor() {
  const [data, setData] = useState<OraculoPageContentData | null>(null);
  const [fromDatabase, setFromDatabase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<TabId>("media");
  const [previewKey, setPreviewKey] = useState(0);
  const [canPersist, setCanPersist] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/oraculo-content", { credentials: "include" });
      const json = (await res.json()) as {
        data?: OraculoPageContentData;
        fromDatabase?: boolean;
        canPersist?: boolean;
        error?: string;
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error || "No se pudo cargar");
      }
      setData(json.data);
      setFromDatabase(Boolean(json.fromDatabase));
      setCanPersist(json.canPersist !== false);
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error al cargar" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const textSections = useMemo(
    () => (data ? buildTextSections(data.blocks) : []),
    [data],
  );

  const imageBlocks = useMemo(() => {
    if (!data) return [];
    return data.blocks
      .map((block, index) => ({ block, index }))
      .filter(
        ({ block }) =>
          (block.kind === "image" || block.kind === "callout_image") &&
          !block.src.endsWith(".bin"),
      );
  }, [data]);

  const videoBlockIndex = useMemo(
    () => data?.blocks.findIndex((b) => b.kind === "video") ?? -1,
    [data],
  );

  const spacerCount = useMemo(
    () => data?.blocks.filter((b) => b.kind === "spacer").length ?? 0,
    [data],
  );

  function updateBlock(index: number, next: OraculoBlock) {
    setData((prev) => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      blocks[index] = next;
      return { ...prev, blocks };
    });
  }

  function setMessageErr(text: string) {
    setMessage({ type: "err", text });
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
      setPreviewKey((k) => k + 1);
      setMessage({ type: "ok", text: "Guardado. La vista previa ya muestra la versión publicada." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDefaults() {
    if (!confirm("¿Restaurar al contenido base del sitio? Se guardará en la base de datos.")) return;
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
      setPreviewKey((k) => k + 1);
      setMessage({ type: "ok", text: "Contenido base restaurado." });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-neutral-500">Cargando editor…</p>;
  }

  if (!data) {
    return <p className="p-8 text-sm text-red-600">No se pudo cargar el contenido.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header
        className="sticky top-0 z-20 border-b border-neutral-200 bg-brand-page/95 px-4 py-4 backdrop-blur md:px-8"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-brand-navy">Oráculo Raíz</h1>
            <p className="mt-0.5 text-xs text-neutral-600">
              {fromDatabase ? "Editando versión publicada" : "Plantilla inicial — guardá para publicar cambios"}
              {spacerCount > 0 && (
                <span className="text-neutral-400"> · {spacerCount} espacios de diseño (ocultos)</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/oraculo"
              target="_blank"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-brand-navy hover:bg-neutral-50"
            >
              Abrir página
            </Link>
            <button
              type="button"
              onClick={() => void handleResetDefaults()}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Restaurar base
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-md px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: brandUi.accent }}
            >
              {saving ? "Guardando…" : "Guardar y publicar"}
            </button>
          </div>
        </div>

        <nav className="mx-auto mt-4 flex max-w-6xl gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="shrink-0 rounded-lg px-4 py-2 text-left transition-colors"
                style={{
                  background: active ? brandUi.accentSoft : "transparent",
                  color: active ? brandUi.accent : brandUi.textMuted,
                }}
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-[10px] opacity-80">{t.hint}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {!canPersist && (
        <p className="mx-auto mt-4 max-w-6xl rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-8">
          La base de datos de este entorno aún no tiene la tabla del CMS de Oráculo. Pedí un redeploy de{" "}
          <strong>dev</strong> en Vercel (el build corre las migraciones) o aplicá la migración{" "}
          <code className="text-xs">20261020153000_add_oraculo_page_content</code> en Neon.
        </p>
      )}

      {message && (
        <p
          className={`mx-auto mt-4 max-w-6xl px-4 text-sm md:px-8 ${
            message.type === "ok" ? "text-green-800" : "text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <div className="min-w-0 flex-1 space-y-6">
          {tab === "media" && (
            <>
              <OraculoMediaField
                label="Video de presentación"
                hint="MP4 recomendado para Chrome. Máx. 48 MB al subir."
                value={data.presentationVideoUrl}
                accept="video/mp4,video/webm,.mp4,.webm"
                onChange={(url) => setData({ ...data, presentationVideoUrl: url })}
                onUploadError={setMessageErr}
              />
              <OraculoMediaField
                label="Audio de bienvenida"
                hint="Se reproduce arriba de la landing, antes del hero."
                value={data.media.bienvenidaAudio}
                accept="audio/*,.m4a,.mp3"
                onChange={(url) =>
                  setData({ ...data, media: { ...data.media, bienvenidaAudio: url } })
                }
                onUploadError={setMessageErr}
              />
              {videoBlockIndex >= 0 && data.blocks[videoBlockIndex]?.kind === "video" && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-brand-navy">Pie de foto del video</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Texto bajo el reproductor en la página.</p>
                  <input
                    className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    value={data.blocks[videoBlockIndex].caption}
                    onChange={(e) => {
                      const block = data.blocks[videoBlockIndex];
                      if (block.kind !== "video") return;
                      updateBlock(videoBlockIndex, { ...block, caption: e.target.value });
                    }}
                  />
                </div>
              )}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Iconos y decoración
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {MEDIA_ICONS.map(({ key, label, hint }) => (
                    <OraculoMediaField
                      key={key}
                      label={label}
                      hint={hint}
                      value={data.media[key]}
                      accept="image/*"
                      onChange={(url) =>
                        setData({ ...data, media: { ...data.media, [key]: url } })
                      }
                      onUploadError={setMessageErr}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "text" && (
            <div className="space-y-8">
              <p className="text-xs text-neutral-600">
                Escribí como en Word: negrita, listas y saltos de línea con la barra de herramientas. No hace falta
                pegar código. La tarjeta de pago y el formulario no se editan acá.
              </p>
              {textSections.map((section, si) => (
                <section
                  key={`${section.title}-${si}`}
                  className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
                >
                  <div
                    className="border-b border-neutral-100 px-4 py-3"
                    style={{ background: brandUi.accentSoft }}
                  >
                    <h2 className="font-serif text-lg text-brand-navy">{section.title}</h2>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {section.items.map(({ index, block }) => {
                      if (block.kind === "sub_header" || block.kind === "sub_sub_header") {
                        return (
                          <div key={index} className="p-4">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                              Encabezado de sección
                            </label>
                            <textarea
                              className="mt-2 w-full min-h-[88px] rounded-md border border-neutral-300 px-3 py-2 text-sm leading-relaxed"
                              value={block.lines.join("\n")}
                              onChange={(e) =>
                                updateBlock(index, {
                                  ...block,
                                  lines: e.target.value.split("\n"),
                                })
                              }
                            />
                            <p className="mt-1 text-[10px] text-neutral-400">Una línea por renglón. Línea vacía = pausa visual.</p>
                          </div>
                        );
                      }
                      if (block.kind === "text") {
                        return (
                          <div key={index} className="p-4">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                              Párrafo
                            </label>
                            <div className="mt-2">
                              <RichTextEditor
                                compact
                                ariaLabel="Párrafo de Oráculo"
                                placeholder="Escribí el texto…"
                                value={block.html}
                                onChange={(html) => updateBlock(index, { ...block, html })}
                              />
                            </div>
                          </div>
                        );
                      }
                      if (block.kind === "bulleted_list") {
                        return (
                          <div key={index} className="p-4">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                              Ítem de lista
                            </label>
                            <div className="mt-2">
                              <RichTextEditor
                                compact
                                ariaLabel="Ítem de lista Oráculo"
                                placeholder="Texto del ítem…"
                                value={
                                  block.text.includes("<")
                                    ? block.text
                                    : block.text
                                      ? `<p>${block.text.replace(/\n/g, "<br />")}</p>`
                                      : ""
                                }
                                onChange={(html) => updateBlock(index, { ...block, text: html })}
                              />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {tab === "images" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {imageBlocks.length === 0 && (
                <p className="text-sm text-neutral-500">No hay imágenes editables en esta versión.</p>
              )}
              {imageBlocks.map(({ block, index }) => (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-brand-navy">{imageBlockTitle(block, index)}</p>
                  {block.kind === "image" && block.src && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={block.src} alt="" className="w-full max-h-40 object-contain" />
                    </div>
                  )}
                  {block.kind === "callout_image" && block.src && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={block.src} alt="" className="w-full max-h-40 object-contain" />
                    </div>
                  )}
                  <label className="mt-3 inline-block cursor-pointer text-xs font-medium text-brand-navy underline">
                    Reemplazar imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadOraculoFile(file);
                          if (block.kind === "image") {
                            updateBlock(index, { ...block, src: url });
                          } else if (block.kind === "callout_image") {
                            updateBlock(index, { ...block, src: url });
                          }
                        } catch (err) {
                          setMessageErr(err instanceof Error ? err.message : "Error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {block.kind === "image" && (
                    <input
                      className="mt-2 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                      placeholder="Texto alternativo (accesibilidad)"
                      value={block.alt ?? ""}
                      onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "payment" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-serif text-lg text-brand-navy">Argentina</h2>
                <PaymentFormField
                  label="Título de columna"
                  value={data.payment.ar.label}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, ar: { ...data.payment.ar, label: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Precio mostrado"
                  hint="Ej: $44.000"
                  value={data.payment.ar.price}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, ar: { ...data.payment.ar, price: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Alias Mercado Pago"
                  value={data.payment.ar.alias}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, ar: { ...data.payment.ar, alias: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Etiqueta del CVU"
                  hint="Ej: Cvu Mercado Pago"
                  value={data.payment.ar.cvuLabel}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, ar: { ...data.payment.ar, cvuLabel: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="CVU"
                  value={data.payment.ar.cvu}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, ar: { ...data.payment.ar, cvu: v } },
                    })
                  }
                />
              </section>

              <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="font-serif text-lg text-brand-navy">España</h2>
                <PaymentFormField
                  label="Título de columna"
                  value={data.payment.es.label}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, es: { ...data.payment.es, label: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Precio mostrado"
                  hint="Ej: €44"
                  value={data.payment.es.price}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, es: { ...data.payment.es, price: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Bizum (teléfono)"
                  value={data.payment.es.phone}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, es: { ...data.payment.es, phone: v } },
                    })
                  }
                />
                <PaymentFormField
                  label="Link de transferencia / pago"
                  hint="Stripe, PayPal u otro. Aparece como «link de pago» en la tarjeta."
                  type="url"
                  value={data.payment.es.paymentLink}
                  onChange={(v) =>
                    setData({
                      ...data,
                      payment: { ...data.payment, es: { ...data.payment.es, paymentLink: v } },
                    })
                  }
                />
              </section>
            </div>
          )}
        </div>

        <aside className="hidden w-full shrink-0 lg:block lg:w-[min(100%,380px)]">
          <div className="sticky top-[11.5rem] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Vista previa</p>
            <p className="mt-1 text-[10px] text-neutral-400 mb-2">Se actualiza después de guardar.</p>
            <iframe
              key={previewKey}
              title="Vista previa Oráculo"
              src="/oraculo"
              className="h-[min(70vh,640px)] w-full rounded-lg border border-neutral-100 bg-neutral-50"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
