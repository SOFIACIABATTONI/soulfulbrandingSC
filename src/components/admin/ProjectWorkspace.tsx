"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@prisma/client";

type WorkspacePhase = {
  id: number;
  title: string;
  anchorId: string;
  startDate: string;
  endDate: string;
  description: string;
  localCoverImage?: string;
  fallbackCoverImage: string;
  fields: PhaseField[];
};

type PhaseField = {
  key: keyof PhaseDraft;
  label: string;
  placeholder: string;
  multiline?: boolean;
  rows?: number;
};

type PhaseDraft = {
  overview: string;
  objective: string;
  deliverables: string;
  assets: string;
  notes: string;
  owner: string;
  status: string;
};

const sharedPhaseFields: PhaseField[] = [
  {
    key: "overview",
    label: "Resumen de la etapa",
    placeholder: "Describe brevemente de qué trata esta fase y cuál es su enfoque.",
    multiline: true,
    rows: 3,
  },
  {
    key: "objective",
    label: "Objetivo",
    placeholder: "¿Qué debería quedar resuelto o definido al finalizar esta etapa?",
    multiline: true,
    rows: 3,
  },
  {
    key: "deliverables",
    label: "Entregables",
    placeholder: "Enumera aquí los entregables, documentos, piezas o decisiones que incluye.",
    multiline: true,
    rows: 4,
  },
  {
    key: "assets",
    label: "Links o referencias",
    placeholder: "Agrega links de Drive, Figma, Notion, inspiración o material complementario.",
    multiline: true,
    rows: 3,
  },
  {
    key: "notes",
    label: "Notas internas",
    placeholder: "Usa este espacio para observaciones, pendientes o recordatorios de esta fase.",
    multiline: true,
    rows: 4,
  },
];

const workspacePhases: WorkspacePhase[] = [
  {
    id: 1,
    title: "1) Onboarding",
    anchorId: "fase-onboarding",
    startDate: "16 de marzo de 2026",
    endDate: "18 de mayo de 2026",
    description: "Primer contacto, alineación inicial y recopilación de contexto del proyecto.",
    localCoverImage: "/admin/project-phases/onboarding.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
  {
    id: 2,
    title: "2) Pre-Brief",
    anchorId: "fase-pre-brief",
    startDate: "16 de marzo de 2026",
    endDate: "18 de mayo de 2026",
    description: "Base estratégica previa al brief formal con información esencial del negocio y su intención.",
    localCoverImage: "/admin/project-phases/pre-brief.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
  {
    id: 3,
    title: "3) Estrategia de marca",
    anchorId: "fase-estrategia",
    startDate: "23 de marzo de 2026",
    endDate: "3 de abril de 2026",
    description: "Narrativa, posicionamiento, conceptos clave y dirección estratégica de la marca.",
    localCoverImage: "/admin/project-phases/estrategia-de-marca.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
  {
    id: 4,
    title: "4) Identidad Visual",
    anchorId: "fase-identidad-visual",
    startDate: "20 de abril de 2026",
    endDate: "11 de mayo de 2026",
    description: "Construcción del sistema visual, recursos gráficos y lineamientos de aplicación.",
    localCoverImage: "/admin/project-phases/identidad-visual.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
  {
    id: 5,
    title: "4) Manual de marca",
    anchorId: "fase-manual-marca",
    startDate: "20 de abril de 2026",
    endDate: "11 de mayo de 2026",
    description: "Documento madre para ordenar el sistema, sus reglas y sus usos recomendados.",
    localCoverImage: "/admin/project-phases/manualde-marca.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
  {
    id: 6,
    title: "5) Testimonio",
    anchorId: "fase-testimonio",
    startDate: "20 de abril de 2026",
    endDate: "11 de mayo de 2026",
    description: "Cierre del proceso con devolución, percepción del cliente y registro del resultado logrado.",
    localCoverImage: "/admin/project-phases/testimonio.jpg",
    fallbackCoverImage:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    fields: sharedPhaseFields,
  },
];

function createInitialPhaseDrafts(): Record<string, PhaseDraft> {
  return Object.fromEntries(
    workspacePhases.map((phase) => [
      phase.anchorId,
      {
        overview: "",
        objective: "",
        deliverables: "",
        assets: "",
        notes: "",
        owner: "",
        status: "Pendiente",
      },
    ]),
  ) as Record<string, PhaseDraft>;
}

type Props = { slug: string };

export function ProjectWorkspace({ slug }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseDraft>>(() => createInitialPhaseDrafts());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/projects?all=1", { credentials: "include" });
      const list = (await res.json()) as Project[];
      const decoded = decodeURIComponent(slug);
      const found = res.ok ? list.find((p) => p.slug === decoded) ?? null : null;
      if (!cancelled) {
        setProject(found as Project | null);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function updatePhaseDraft(anchorId: string, key: keyof PhaseDraft, value: string) {
    setPhaseDrafts((current) => ({
      ...current,
      [anchorId]: {
        ...current[anchorId],
        [key]: value,
      },
    }));
  }

  if (loading) {
    return <p className="p-8 text-neutral-600">Cargando proyecto…</p>;
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-serif text-2xl text-brand-navy">Proyecto no encontrado</h1>
        <p className="mt-2 text-sm text-neutral-600">No hay un proyecto con ese slug en la base de datos.</p>
        <Link href="/admin/projects" className="mt-6 inline-block text-sm font-medium text-brand-blue hover:underline">
          ← Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[28px] border border-neutral-200/80 bg-white p-4 shadow-sm md:p-8">
        <div className="flex flex-col gap-3 border-b border-neutral-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">Panel del proyecto</p>
            <h1 className="mt-2 font-serif text-3xl text-brand-navy md:text-4xl">Proyectos</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Entregables y fases para <span className="font-medium text-brand-navy">{project.title}</span> · /portfolio/
              {project.slug}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/portfolio/${project.slug}`} className="text-sm text-brand-blue hover:underline" target="_blank">
              Ver en el sitio
            </Link>
            <Link href="/admin/projects" className="text-sm font-medium text-brand-blue hover:underline">
              ← Todos los proyectos
            </Link>
          </div>
        </div>

        <ProjectsPortalPreview projectTitle={project.title} />
        <ProjectPhaseSections drafts={phaseDrafts} onChange={updatePhaseDraft} />
      </section>
    </div>
  );
}

function ProjectsPortalPreview({ projectTitle }: { projectTitle: string }) {
  return (
    <div id="projects-grid" className="mt-8 rounded-[24px] bg-[#fcfcfb] p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-[28px]">{projectTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">Cada card te lleva directo a su sección para completar información.</p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-neutral-400 sm:pb-0">
          <ToolbarIcon>
            <FilterIcon />
          </ToolbarIcon>
          <ToolbarIcon>
            <SortIcon />
          </ToolbarIcon>
          <ToolbarIcon>
            <BoltIcon />
          </ToolbarIcon>
          <ToolbarIcon>
            <SearchIcon />
          </ToolbarIcon>
          <ToolbarIcon>
            <ExpandIcon />
          </ToolbarIcon>
          <ToolbarIcon>
            <SlidersIcon />
          </ToolbarIcon>
          <div className="mx-1 h-5 w-px bg-neutral-200" />
          <button
            type="button"
            className="ml-1 flex shrink-0 items-center gap-1.5 rounded-md bg-[#2383e2] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a73cb]"
          >
            Nuevo
            <ChevronDownIcon />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {workspacePhases.map((phase) => (
          <a
            key={phase.id}
            href={`#${phase.anchorId}`}
            className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <article>
              <div className="relative h-[190px] overflow-hidden bg-neutral-100">
                <div
                  aria-label={phase.title}
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: buildPhaseCover(phase) }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />
                <div className="absolute right-3 top-3 rounded-full bg-white/88 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
                  Completar info
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-rose-100">
                    <span className="text-[10px] font-semibold text-rose-500">SB</span>
                  </div>
                  <h3 className="truncate text-[15px] font-semibold leading-tight text-neutral-900">{phase.title}</h3>
                </div>

                <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{phase.description}</p>

                <div className="flex flex-col gap-1 pt-1">
                  <time className="text-[13px] leading-none text-neutral-600">{phase.startDate}</time>
                  <time className="mt-1 text-[13px] leading-none text-neutral-600">{phase.endDate}</time>
                </div>
              </div>
            </article>
          </a>
        ))}
      </div>
    </div>
  );
}

function ProjectPhaseSections({
  drafts,
  onChange,
}: {
  drafts: Record<string, PhaseDraft>;
  onChange: (anchorId: string, key: keyof PhaseDraft, value: string) => void;
}) {
  return (
    <div className="mt-10 space-y-6">
      {workspacePhases.map((phase) => {
        const draft = drafts[phase.anchorId];

        return (
          <section
            id={phase.anchorId}
            key={phase.anchorId}
            className="scroll-mt-24 overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
          >
            <div className="relative h-[180px] overflow-hidden border-b border-neutral-200 bg-neutral-100">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: buildPhaseCover(phase) }} />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 px-5 pb-5">
                <div className="max-w-2xl text-white">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/80">Etapa del proyecto</p>
                  <h3 className="mt-2 text-2xl font-semibold md:text-3xl">{phase.title}</h3>
                  <p className="mt-2 text-sm text-white/90">{phase.description}</p>
                </div>
                <a href="#projects-grid" className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-800">
                  Volver a cards
                </a>
              </div>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
              <div className="space-y-4">
                {phase.fields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-800">{field.label}</span>
                    {field.multiline ? (
                      <textarea
                        rows={field.rows ?? 3}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-brand-blue"
                        placeholder={field.placeholder}
                        value={draft[field.key]}
                        onChange={(e) => onChange(phase.anchorId, field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-brand-blue"
                        placeholder={field.placeholder}
                        value={draft[field.key]}
                        onChange={(e) => onChange(phase.anchorId, field.key, e.target.value)}
                      />
                    )}
                  </label>
                ))}
              </div>

              <aside className="space-y-4 rounded-[20px] bg-neutral-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">Seguimiento</p>
                  <h4 className="mt-2 text-lg font-semibold text-neutral-900">Estado de la fase</h4>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-800">Responsable</span>
                  <input
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-brand-blue"
                    placeholder="Ej. Sofia / cliente / equipo visual"
                    value={draft.owner}
                    onChange={(e) => onChange(phase.anchorId, "owner", e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-800">Estado</span>
                  <select
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-brand-blue"
                    value={draft.status}
                    onChange={(e) => onChange(phase.anchorId, "status", e.target.value)}
                  >
                    <option>Pendiente</option>
                    <option>En proceso</option>
                    <option>En revisión</option>
                    <option>Completada</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                  <p className="font-medium text-neutral-900">Fechas de referencia</p>
                  <p className="mt-2">Inicio: {phase.startDate}</p>
                  <p className="mt-1">Entrega: {phase.endDate}</p>
                </div>

                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                  Este bloque ya queda preparado para una segunda etapa donde guardemos cada fase en base de datos.
                </div>
              </aside>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ToolbarIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
    >
      {children}
    </button>
  );
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      {children}
    </svg>
  );
}

function FilterIcon() {
  return (
    <IconBase>
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
    </IconBase>
  );
}

function SortIcon() {
  return (
    <IconBase>
      <path d="M7 4v16" />
      <path d="m4 7 3-3 3 3" />
      <path d="M17 20V4" />
      <path d="m14 17 3 3 3-3" />
    </IconBase>
  );
}

function BoltIcon() {
  return (
    <IconBase>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </IconBase>
  );
}

function SearchIcon() {
  return (
    <IconBase>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </IconBase>
  );
}

function ExpandIcon() {
  return (
    <IconBase>
      <path d="M9 3H3v6" />
      <path d="m3 3 7 7" />
      <path d="M15 21h6v-6" />
      <path d="m21 21-7-7" />
      <path d="M21 9V3h-6" />
      <path d="m14 10 7-7" />
      <path d="M3 15v6h6" />
      <path d="m10 14-7 7" />
    </IconBase>
  );
}

function SlidersIcon() {
  return (
    <IconBase>
      <path d="M4 6h10" />
      <path d="M4 18h16" />
      <path d="M10 12h10" />
      <circle cx="17" cy="6" r="2" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </IconBase>
  );
}

function ChevronDownIcon() {
  return (
    <IconBase>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

function buildPhaseCover(phase: WorkspacePhase) {
  const images = [phase.localCoverImage, phase.fallbackCoverImage].filter(Boolean).map((image) => `url("${image}")`);
  return images.join(", ");
}
