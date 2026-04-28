"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

// ── tipos ──────────────────────────────────────────────────
type InvoiceSummary = {
  id: string; number: string; type: string; total: number; status: string; issuedAt: string;
};

type ClientProject = {
  id: string; title: string; service: string; value: number; status: string;
  phases: Record<string, Record<string, string>>;
  startDate: string | null; deliveryDate: string | null; notes: string;
  client: { id: string; name: string; company: string };
  invoices: InvoiceSummary[];
};

type PhaseContent = {
  state: string; overview: string; objective: string;
  deliverables: string; assets: string; notes: string; owner: string;
};

// ── fases del proyecto ─────────────────────────────────────
const PHASES = [
  {
    key: "onboarding", title: "1) Onboarding",
    desc: "Primer contacto, alineación inicial y recopilación de contexto del proyecto.",
    cover: "/admin/project-phases/onboarding.jpg",
    fallback: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "prebrief", title: "2) Pre-brief",
    desc: "Base estratégica previa al brief formal con información esencial del negocio.",
    cover: "/admin/project-phases/pre-brief.jpg",
    fallback: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "narrativa", title: "3) Narrativa de marca",
    desc: "Narrativa, posicionamiento, conceptos clave y dirección estratégica.",
    cover: "/admin/project-phases/estrategia-de-marca.jpg",
    fallback: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "identidad", title: "4) Identidad Visual",
    desc: "Construcción del sistema visual, recursos gráficos y lineamientos de aplicación.",
    cover: "/admin/project-phases/identidad-visual.jpg",
    fallback: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  },
  {
    key: "manual", title: "5) Manual de marca",
    desc: "Documento madre para ordenar el sistema, sus reglas y sus usos recomendados.",
    cover: "/admin/project-phases/manualde-marca.jpg",
    fallback: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
  },
];

const PHASE_FIELDS = [
  { key: "overview", label: "Resumen de la etapa", placeholder: "Describí brevemente de qué trata esta fase.", rows: 3 },
  { key: "objective", label: "Objetivo", placeholder: "¿Qué debería quedar resuelto al finalizar?", rows: 3 },
  { key: "deliverables", label: "Entregables", placeholder: "Enumera los entregables, documentos o decisiones.", rows: 4 },
  { key: "assets", label: "Links o referencias", placeholder: "Drive, Figma, Notion, inspiración…", rows: 3 },
  { key: "notes", label: "Notas internas", placeholder: "Observaciones, pendientes o recordatorios.", rows: 4 },
];

const STATE_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "active", label: "En proceso" },
  { value: "done", label: "Completada" },
];

const STATE_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(13,13,13,0.06)", color: "rgba(13,13,13,0.4)" },
  active: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  done: { bg: "#e3f2e3", color: "#1a6b1a" },
};

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

const PROJECT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  onboarding: { bg: "rgba(50,63,246,0.08)", color: "#323FF6" },
  diseno: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  implementacion: { bg: "rgba(255,160,0,0.12)", color: "#b45000" },
  entregado: { bg: "#e3f2e3", color: "#1a6b1a" },
};

function emptyPhaseContent(): PhaseContent {
  return { state: "pending", overview: "", objective: "", deliverables: "", assets: "", notes: "", owner: "" };
}

function parsePhases(raw: Record<string, Record<string, string>>): Record<string, PhaseContent> {
  const result: Record<string, PhaseContent> = {};
  for (const ph of PHASES) {
    const saved = raw[ph.key] ?? {};
    result[ph.key] = {
      state: saved.state ?? "pending",
      overview: saved.overview ?? "",
      objective: saved.objective ?? "",
      deliverables: saved.deliverables ?? "",
      assets: saved.assets ?? "",
      notes: saved.notes ?? "",
      owner: saved.owner ?? "",
    };
  }
  return result;
}

function phaseCover(ph: typeof PHASES[0]) {
  return `url("${ph.cover}"), url("${ph.fallback}")`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { dateStyle: "medium" });
}

// ── componente principal ───────────────────────────────────
export function ERPProjectWorkspace({ project: initial }: { project: ClientProject }) {
  const [project, setProject] = useState(initial);
  const [phases, setPhases] = useState<Record<string, PhaseContent>>(() =>
    parsePhases(initial.phases ?? {})
  );
  const [savingPhase, setSavingPhase] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  const savePhaseContent = useCallback(
    async (key: string, data: Partial<PhaseContent>) => {
      setSavingPhase(key);
      const { state, ...content } = data;
      await fetch(`/api/admin/projects-erp/${project.id}/phases`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: key, ...(state ? { state } : {}), content }),
      });
      setSavingPhase(null);
    },
    [project.id]
  );

  function updateField(phaseKey: string, field: keyof PhaseContent, value: string) {
    setPhases((prev) => ({
      ...prev,
      [phaseKey]: { ...prev[phaseKey], [field]: value },
    }));
  }

  async function saveStatus(value: string) {
    setSavingProject(true);
    const res = await fetch(`/api/admin/projects-erp/${project.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (res.ok) {
      const j = (await res.json()) as { item: ClientProject };
      setProject((p) => ({ ...p, status: j.item.status }));
    }
    setSavingProject(false);
  }

  const totalFacturado = project.invoices.reduce((a, i) => a + i.total, 0);
  const porCobrar = project.invoices.filter((i) => i.status === "pendiente").reduce((a, i) => a + i.total, 0);
  const sc = PROJECT_STATUS_COLORS[project.status] ?? PROJECT_STATUS_COLORS.onboarding;

  return (
    <div className="rounded-[28px] border border-neutral-200/80 bg-white p-4 shadow-sm md:p-8">

      {/* ── Cabecera ── */}
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">Workspace del proyecto</p>
          <h1 className="mt-2 font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
            {project.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(13,13,13,0.42)" }}>
            {project.client.name}
            {project.client.company ? ` — ${project.client.company}` : ""}
            {" · "}{SERVICE_LABELS[project.service] ?? project.service}
            {" · "}${project.value.toLocaleString("es-AR")} USD
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded border px-3 py-1.5 text-sm"
            style={{ borderColor: "rgba(50,63,246,0.4)", color: "#0D0D0D" }}
            value={project.status}
            disabled={savingProject}
            onChange={(e) => void saveStatus(e.target.value)}
          >
            <option value="onboarding">Onboarding</option>
            <option value="diseno">Diseño</option>
            <option value="implementacion">Implementación</option>
            <option value="entregado">Entregado</option>
          </select>
          <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ background: sc.bg, color: sc.color }}>
            {project.status}
          </span>
        </div>
      </div>

      {/* ── Grilla de cards ── */}
      <div id="phases-grid" className="rounded-[24px] bg-[#fcfcfb] p-4 md:p-6 mb-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">{project.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Cada card te lleva directo a su sección. Hacé clic para completar información.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((ph) => {
            const pc = phases[ph.key];
            const stc = STATE_COLORS[pc.state] ?? STATE_COLORS.pending;
            return (
              <a key={ph.key} href={`#fase-${ph.key}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <article>
                  <div className="relative h-[160px] overflow-hidden bg-neutral-100">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                      style={{ backgroundImage: phaseCover(ph) }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium shadow-sm"
                      style={{ color: stc.color }}>
                      {STATE_OPTIONS.find((s) => s.value === pc.state)?.label ?? "Pendiente"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                        style={{ background: "rgba(240,49,114,0.1)" }}>
                        <span className="text-[9px] font-semibold" style={{ color: "#F03172" }}>SB</span>
                      </div>
                      <h3 className="truncate text-[14px] font-semibold leading-tight text-neutral-900">
                        {ph.title}
                      </h3>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{ph.desc}</p>
                  </div>
                </article>
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Secciones de fases ── */}
      <div className="space-y-6">
        {PHASES.map((ph) => {
          const pc = phases[ph.key];
          const isSaving = savingPhase === ph.key;
          return (
            <section key={ph.key} id={`fase-${ph.key}`}
              className="scroll-mt-24 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm">
              {/* Portada */}
              <div className="relative h-[180px] overflow-hidden border-b border-neutral-200 bg-neutral-100">
                <div className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: phaseCover(ph) }} />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-5 pb-5">
                  <div className="max-w-2xl text-white">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                      Etapa del proyecto
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">{ph.title}</h3>
                    <p className="mt-1 text-sm text-white/85">{ph.desc}</p>
                  </div>
                  <a href="#phases-grid"
                    className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-neutral-800">
                    Volver a cards
                  </a>
                </div>
              </div>

              {/* Contenido */}
              <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
                {/* Campos principales */}
                <div className="space-y-4">
                  {PHASE_FIELDS.map((f) => (
                    <label key={f.key} className="block">
                      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
                        {f.label}
                      </span>
                      <textarea
                        rows={f.rows}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                        placeholder={f.placeholder}
                        value={pc[f.key as keyof PhaseContent] ?? ""}
                        onChange={(e) => updateField(ph.key, f.key as keyof PhaseContent, e.target.value)}
                        onBlur={() =>
                          void savePhaseContent(ph.key, { [f.key]: pc[f.key as keyof PhaseContent] })
                        }
                      />
                    </label>
                  ))}
                </div>

                {/* Sidebar de seguimiento */}
                <aside className="space-y-4 rounded-[20px] bg-neutral-50 p-4 h-fit">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                      Seguimiento
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-neutral-900">Estado de la fase</h4>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-800">Responsable</span>
                    <input
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                      placeholder="Sofia / cliente / equipo"
                      value={pc.owner}
                      onChange={(e) => updateField(ph.key, "owner", e.target.value)}
                      onBlur={() => void savePhaseContent(ph.key, { owner: pc.owner })}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-neutral-800">Estado</span>
                    <select
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-[#323FF6]"
                      value={pc.state}
                      onChange={(e) => {
                        updateField(ph.key, "state", e.target.value);
                        void savePhaseContent(ph.key, { state: e.target.value });
                      }}
                    >
                      {STATE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>

                  {/* Fechas del proyecto */}
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                    <p className="font-medium text-neutral-900 mb-2">Fechas del proyecto</p>
                    <p>Inicio: <span className="font-medium">{formatDate(project.startDate)}</span></p>
                    <p className="mt-1">Entrega: <span className="font-medium">{formatDate(project.deliveryDate)}</span></p>
                  </div>

                  {/* Estado de guardado */}
                  {isSaving && (
                    <p className="text-[11px] text-center" style={{ color: "#323FF6" }}>
                      Guardando…
                    </p>
                  )}

                  {/* Facturas vinculadas */}
                  {project.invoices.length > 0 && (
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-2">
                        Facturación
                      </p>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Facturado</span>
                        <span className="font-medium">${totalFacturado.toLocaleString("es-AR")} USD</span>
                      </div>
                      {porCobrar > 0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: "#b45000" }}>Por cobrar</span>
                          <span className="font-medium" style={{ color: "#b45000" }}>
                            ${porCobrar.toLocaleString("es-AR")} USD
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Link href={`/admin/clientes/${project.client.id}`}
                    className="block text-center rounded-2xl border border-neutral-200 px-4 py-2.5 text-xs font-medium hover:bg-neutral-50 transition-colors"
                    style={{ color: "#323FF6" }}>
                    Ver ficha de {project.client.name} →
                  </Link>
                </aside>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
