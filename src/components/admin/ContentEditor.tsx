"use client";

import { useEffect, useState } from "react";
import type { SiteContentData } from "@/lib/site-content";
import { defaultSiteContent } from "@/lib/site-content";
import { ImageField } from "@/components/admin/ImageField";

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ContentEditor() {
  const [data, setData] = useState<SiteContentData>(defaultSiteContent());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/site", { credentials: "include" });
      const j = await res.json();
      if (!cancelled && res.ok) setData(j as SiteContentData);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/site", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setMsg(res.ok ? "Guardado correctamente." : "No se pudo guardar.");
  }

  if (loading) {
    return <p className="p-8 text-neutral-600">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl">Contenido del sitio</h1>
      <p className="mt-2 text-sm text-neutral-600">Los cambios se reflejan en la portada al guardar.</p>

      <section className="mt-10 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">General</h2>
        <label className="block text-sm font-medium">Título del sitio (pestaña del navegador)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.meta.siteTitle}
          onChange={(e) => setData({ ...data, meta: { ...data.meta, siteTitle: e.target.value } })}
        />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Hero</h2>
        <label className="block text-sm font-medium">Línea superior (opcional)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.hero.eyebrow}
          onChange={(e) => setData({ ...data, hero: { ...data.hero, eyebrow: e.target.value } })}
        />
        <label className="block text-sm font-medium">Título (ej. SOULFUL BRANDING® — se parte en dos columnas)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.hero.title}
          onChange={(e) => setData({ ...data, hero: { ...data.hero, title: e.target.value } })}
        />
        <label className="block text-sm font-medium">Palabra bajo el titular (ej. EXPERIENCE)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.hero.experienceWord}
          onChange={(e) => setData({ ...data, hero: { ...data.hero, experienceWord: e.target.value } })}
        />
        <label className="block text-sm font-medium">Subtítulo bajo el bloque (opcional)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.hero.subtitle}
          onChange={(e) => setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })}
        />
        <ImageField label="Imagen central (mujer)" value={data.hero.imageUrl} onChange={(url) => setData({ ...data, hero: { ...data.hero, imageUrl: url } })} />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Esencia</h2>
        <label className="block text-sm font-medium">Titular</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.essence.headline}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, headline: e.target.value } })}
        />
        <label className="block text-sm font-medium">Viñetas (una por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={5}
          value={data.essence.bullets.join("\n")}
          onChange={(e) =>
            setData({
              ...data,
              essence: {
                ...data.essence,
                bullets: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
        <label className="block text-sm font-medium">Párrafo (magnetismo)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.essence.bodyParagraph}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, bodyParagraph: e.target.value } })}
        />
        <label className="block text-sm font-medium">Línea de trabajo</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.essence.workLine}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, workLine: e.target.value } })}
        />
        <label className="block text-sm font-medium">Cierre (That&apos;s WHY …)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.essence.whyLine}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, whyLine: e.target.value } })}
        />
        <label className="block text-sm font-medium">Firma — nombre</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.essence.signatureName}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, signatureName: e.target.value } })}
        />
        <label className="block text-sm font-medium">Firma — rol</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.essence.signatureRole}
          onChange={(e) => setData({ ...data, essence: { ...data.essence, signatureRole: e.target.value } })}
        />
        <ImageField label="Imagen izquierda (desktop)" value={data.essence.imageLeftUrl} onChange={(url) => setData({ ...data, essence: { ...data.essence, imageLeftUrl: url } })} />
        <ImageField label="Imagen derecha" value={data.essence.imageRightUrl} onChange={(url) => setData({ ...data, essence: { ...data.essence, imageRightUrl: url } })} />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-xs text-neutral-500">
          Estos campos impactan la sección About de home (mobile y desktop).
        </p>
        <label className="block text-sm font-medium">Encabezado</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.about.heading}
          onChange={(e) => setData({ ...data, about: { ...data.about, heading: e.target.value } })}
        />
        <label className="block text-sm font-medium">Texto</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={5}
          value={data.about.body}
          onChange={(e) => setData({ ...data, about: { ...data.about, body: e.target.value } })}
        />
        <label className="block text-sm font-medium">Texto secundario (letra pequeña, debajo)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={8}
          value={data.about.finePrint ?? ""}
          onChange={(e) => setData({ ...data, about: { ...data.about, finePrint: e.target.value } })}
        />
        <label className="block text-sm font-medium">Enlace “read more”</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.about.readMoreLabel}
          onChange={(e) => setData({ ...data, about: { ...data.about, readMoreLabel: e.target.value } })}
        />
        <ImageField
          label="Imagen"
          value={data.about.imageUrl}
          onChange={(url) => setData({ ...data, about: { ...data.about, imageUrl: url } })}
          minWidth={900}
          minHeight={1200}
          ratio="3:4 (vertical)"
        />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">More About (página /about)</h2>
        <p className="text-xs text-neutral-500">
          Estos campos se ven al presionar “More About”, tanto en mobile como en desktop.
        </p>

        <label className="block text-sm font-medium">Intro (3 párrafos, uno por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={5}
          value={(data.aboutMore?.introParagraphs ?? []).join("\n")}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, introParagraphs: splitLines(e.target.value) } })}
        />

        <label className="block text-sm font-medium">Texto “Since 2018…”</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={4}
          value={data.aboutMore?.sinceText ?? ""}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, sinceText: e.target.value } })}
        />

        <label className="block text-sm font-medium">Texto “Gracias a mi experiencia…”</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.aboutMore?.graciasText ?? ""}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, graciasText: e.target.value } })}
        />

        <label className="block text-sm font-medium">Texto de proceso (resaltado)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.aboutMore?.processText ?? ""}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, processText: e.target.value } })}
        />

        <label className="block text-sm font-medium">Cierre — Intro</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.aboutMore?.closingIntro ?? ""}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, closingIntro: e.target.value } })}
        />

        <label className="block text-sm font-medium">Cierre — bullets (uno por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={4}
          value={(data.aboutMore?.closingBullets ?? []).join("\n")}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, closingBullets: splitLines(e.target.value) } })}
        />

        <label className="block text-sm font-medium">Cierre — párrafo final</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={4}
          value={data.aboutMore?.closingOutro ?? ""}
          onChange={(e) => setData({ ...data, aboutMore: { ...data.aboutMore, closingOutro: e.target.value } })}
        />

        <ImageField
          label="Imagen retrato principal"
          value={data.aboutMore?.imagePortraitUrl ?? ""}
          onChange={(url) => setData({ ...data, aboutMore: { ...data.aboutMore, imagePortraitUrl: url } })}
          minWidth={900}
          minHeight={1200}
          ratio="3:4 (vertical)"
        />
        <ImageField
          label="Imagen libro"
          value={data.aboutMore?.imageBookUrl ?? ""}
          onChange={(url) => setData({ ...data, aboutMore: { ...data.aboutMore, imageBookUrl: url } })}
          minWidth={900}
          minHeight={900}
          ratio="1:1"
        />
        <ImageField
          label="Imagen expandida lateral"
          value={data.aboutMore?.imageExpandedUrl ?? ""}
          onChange={(url) => setData({ ...data, aboutMore: { ...data.aboutMore, imageExpandedUrl: url } })}
          minWidth={900}
          minHeight={1200}
          ratio="3:4 o 2:3"
        />
        <ImageField
          label="Imagen laptop (fila final móvil)"
          value={data.aboutMore?.imageMainLaptopUrl ?? ""}
          onChange={(url) => setData({ ...data, aboutMore: { ...data.aboutMore, imageMainLaptopUrl: url } })}
          minWidth={900}
          minHeight={1200}
          ratio="3:4 (vertical)"
        />
        <ImageField
          label="Imagen buda fucsia (móvil)"
          value={data.aboutMore?.imageBuddhaUrl ?? ""}
          onChange={(url) => setData({ ...data, aboutMore: { ...data.aboutMore, imageBuddhaUrl: url } })}
          minWidth={500}
          minHeight={500}
          ratio="1:1"
        />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Método (página /about)</h2>
        <p className="text-xs text-neutral-500">
          Sección “About y Método”. Estos textos aplican a ambos breakpoints; cambia solo el layout visual.
        </p>
        <label className="block text-sm font-medium">Etiqueta superior</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.tagLabel ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, tagLabel: e.target.value } })}
        />
        <label className="block text-sm font-medium">Título</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.title ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, title: e.target.value } })}
        />
        <label className="block text-sm font-medium">Intro párrafo 1</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.method?.introParagraph1 ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, introParagraph1: e.target.value } })}
        />
        <label className="block text-sm font-medium">Línea destacada</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.introHighlight ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, introHighlight: e.target.value } })}
        />
        <label className="block text-sm font-medium">Intro párrafo 2</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.method?.introParagraph2 ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, introParagraph2: e.target.value } })}
        />
        <label className="block text-sm font-medium">Intro de pilares</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.pillarsIntro ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, pillarsIntro: e.target.value } })}
        />
        <label className="block text-sm font-medium">Pilares (uno por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={4}
          value={(data.method?.pillars ?? []).join("\n")}
          onChange={(e) => setData({ ...data, method: { ...data.method, pillars: splitLines(e.target.value) } })}
        />
        <label className="block text-sm font-medium">Intro de transiciones</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.transitionsIntro ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, transitionsIntro: e.target.value } })}
        />
        <label className="block text-sm font-medium">Transiciones (una por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={4}
          value={(data.method?.transitions ?? []).join("\n")}
          onChange={(e) => setData({ ...data, method: { ...data.method, transitions: splitLines(e.target.value) } })}
        />
        <label className="block text-sm font-medium">Marca de agua final</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.method?.watermarkText ?? ""}
          onChange={(e) => setData({ ...data, method: { ...data.method, watermarkText: e.target.value } })}
        />
        <ImageField
          label="Imagen superior método"
          value={data.method?.imageTopUrl ?? ""}
          onChange={(url) => setData({ ...data, method: { ...data.method, imageTopUrl: url } })}
          minWidth={900}
          minHeight={1200}
          ratio="3:4 (vertical)"
        />
        <ImageField
          label="Imagen inferior método"
          value={data.method?.imageBottomUrl ?? ""}
          onChange={(url) => setData({ ...data, method: { ...data.method, imageBottomUrl: url } })}
          minWidth={700}
          minHeight={900}
          ratio="3:4 (vertical)"
        />
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Etapas</h2>
        <p className="text-xs text-neutral-500">
          Solo edición de contenido visible (texto + imagen).
        </p>
        <label className="block text-sm font-medium">Titular</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.stages.heading}
          onChange={(e) => setData({ ...data, stages: { ...data.stages, heading: e.target.value } })}
        />
        <ImageField label="Imagen lateral" value={data.stages.imageUrl} onChange={(url) => setData({ ...data, stages: { ...data.stages, imageUrl: url } })} />
        {data.stages.stages.map((s, i) => (
          <div key={i} className="rounded-md border border-neutral-100 p-3">
            <p className="text-xs font-semibold text-neutral-500">Etapa {i + 1}</p>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={s.title}
              onChange={(e) => {
                const stages = [...data.stages.stages];
                stages[i] = { ...stages[i], title: e.target.value };
                setData({ ...data, stages: { ...data.stages, stages } });
              }}
            />
            <label className="mt-2 block text-xs font-medium text-neutral-600">Línea corta (gancho)</label>
            <input
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={s.description}
              onChange={(e) => {
                const stages = [...data.stages.stages];
                stages[i] = { ...stages[i], description: e.target.value };
                setData({ ...data, stages: { ...data.stages, stages } });
              }}
            />
            <label className="mt-2 block text-xs font-medium text-neutral-600">Subtítulo (párrafo largo visible en la tarjeta)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              rows={4}
              value={s.subtitle ?? ""}
              onChange={(e) => {
                const stages = [...data.stages.stages];
                stages[i] = { ...stages[i], subtitle: e.target.value };
                setData({ ...data, stages: { ...data.stages, stages } });
              }}
            />
          </div>
        ))}
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Servicios</h2>
        <p className="text-xs text-neutral-500">
          Solo edición de contenido visible (texto).
        </p>
        <label className="block text-sm font-medium">Palabra de fondo</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.services.backgroundWord}
          onChange={(e) => setData({ ...data, services: { ...data.services, backgroundWord: e.target.value } })}
        />
        {data.services.items.map((item, i) => (
          <div key={i} className="rounded-md border border-neutral-100 p-3">
            <p className="text-xs font-semibold text-neutral-500">Servicio {i + 1}</p>
            <input
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={item.title}
              onChange={(e) => {
                const items = [...data.services.items];
                items[i] = { ...items[i], title: e.target.value };
                setData({ ...data, services: { ...data.services, items } });
              }}
            />
            <textarea
              className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              rows={2}
              value={item.description}
              onChange={(e) => {
                const items = [...data.services.items];
                items[i] = { ...items[i], description: e.target.value };
                setData({ ...data, services: { ...data.services, items } });
              }}
            />
          </div>
        ))}
      </section>

      <section className="mt-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Contacto</h2>
        <p className="text-xs text-neutral-500">
          Textos e imágenes. Links de redes opcionales.
        </p>
        <label className="block text-sm font-medium">Encabezado</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.contact.heading}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, heading: e.target.value } })}
        />
        <label className="block text-sm font-medium">Texto</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          rows={3}
          value={data.contact.intro}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, intro: e.target.value } })}
        />
        <label className="block text-sm font-medium">URL Instagram</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.contact.instagramUrl}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, instagramUrl: e.target.value } })}
        />
        <label className="block text-sm font-medium">Email (mailto)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="mailto:hola@ejemplo.com"
          value={data.contact.emailMailto ?? ""}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, emailMailto: e.target.value } })}
        />
        <label className="block text-sm font-medium">URL Substack</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.contact.substackUrl ?? ""}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, substackUrl: e.target.value } })}
        />
        <label className="block text-sm font-medium">URL Pinterest</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.contact.pinterestUrl ?? ""}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, pinterestUrl: e.target.value } })}
        />
        <label className="block text-sm font-medium">Pie de página (marca)</label>
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          value={data.contact.footerTagline}
          onChange={(e) => setData({ ...data, contact: { ...data.contact, footerTagline: e.target.value } })}
        />
        <label className="block text-sm font-medium">Líneas bajo la marca (una por línea)</label>
        <textarea
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
          rows={4}
          value={(data.contact.footerLines ?? []).join("\n")}
          onChange={(e) =>
            setData({
              ...data,
              contact: {
                ...data.contact,
                footerLines: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
        <ImageField label="Imagen pie" value={data.contact.footerImageUrl} onChange={(url) => setData({ ...data, contact: { ...data.contact, footerImageUrl: url } })} />
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-md bg-brand-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand-navyDark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {msg && <span className="text-sm text-neutral-700">{msg}</span>}
      </div>
    </div>
  );
}
