export type ProjectPhaseDefinition = {
  key: string;
  title: string;
  desc: string;
  cover: string;
  fallback: string;
  /** Fase fija del flujo Soulful (onboarding, prebrief, etc.) */
  builtin: boolean;
  /** Usa editor genérico + envío al cliente por mail */
  genericClient?: boolean;
};

export const DEFAULT_PROJECT_PHASES: ProjectPhaseDefinition[] = [
  {
    key: "onboarding",
    title: "1) Onboarding",
    desc: "Primer contacto, alineación inicial y recopilación de contexto del proyecto.",
    cover: "/admin/project-phases/onboarding.jpg",
    fallback:
      "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
    builtin: true,
  },
  {
    key: "prebrief",
    title: "2) Pre-brief",
    desc: "Base estratégica previa al brief formal con información esencial del negocio.",
    cover: "/admin/project-phases/pre-brief.jpg",
    fallback:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
    builtin: true,
  },
  {
    key: "narrativa",
    title: "3) Narrativa de marca",
    desc: "Narrativa, posicionamiento, conceptos clave y dirección estratégica.",
    cover: "/admin/project-phases/estrategia-de-marca.jpg",
    fallback:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop",
    builtin: true,
  },
  {
    key: "identidad",
    title: "4) Identidad Visual",
    desc: "Construcción del sistema visual, recursos gráficos y lineamientos de aplicación.",
    cover: "/admin/project-phases/identidad-visual.jpg",
    fallback:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    builtin: true,
  },
  {
    key: "manual",
    title: "5) Manual de marca",
    desc: "Documento madre para ordenar el sistema, sus reglas y sus usos recomendados.",
    cover: "/admin/project-phases/manualde-marca.jpg",
    fallback:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
    builtin: true,
  },
];

export const GENERIC_PROJECT_PHASE_FALLBACK =
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop";

export function isBuiltinProjectPhaseKey(key: string): boolean {
  return DEFAULT_PROJECT_PHASES.some((p) => p.key === key);
}

export function isCustomProjectPhaseKey(key: string): boolean {
  return key.startsWith("custom-");
}
