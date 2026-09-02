export type ContentSectionId =
  | "general"
  | "hero"
  | "essence"
  | "about"
  | "about-more"
  | "method"
  | "stages"
  | "services"
  | "contact"
  | "testimonials";

export type ContentSection = {
  id: ContentSectionId;
  label: string;
  description: string;
  /** Dónde impacta en el sitio público */
  scope: string;
};

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    id: "general",
    label: "General",
    description: "Título del sitio y metadatos básicos",
    scope: "Pestaña del navegador",
  },
  {
    id: "hero",
    label: "Hero",
    description: "Portada principal de la home",
    scope: "Home — sección superior",
  },
  {
    id: "essence",
    label: "Esencia",
    description: "Bloque de propuesta y firma",
    scope: "Home — Esencia",
  },
  {
    id: "about",
    label: "About (home)",
    description: "Resumen About en la portada",
    scope: "Home — About",
  },
  {
    id: "about-more",
    label: "More About",
    description: "Página expandida /about",
    scope: "/about — texto e imágenes",
  },
  {
    id: "method",
    label: "Método",
    description: "Sección del método Soulful Branding®",
    scope: "/about — método",
  },
  {
    id: "stages",
    label: "Etapas",
    description: "Proceso en tarjetas",
    scope: "Home — Etapas",
  },
  {
    id: "services",
    label: "Servicios",
    description: "Listado de servicios",
    scope: "Home — Servicios",
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Formulario, redes y pie",
    scope: "Home — Contacto y footer",
  },
  {
    id: "testimonials",
    label: "Testimonios",
    description: "Carrusel en /portfolio y fichas de caso",
    scope: "/portfolio — carrusel y desplegable en casos",
  },
];

export function isContentSectionId(value: string): value is ContentSectionId {
  return CONTENT_SECTIONS.some((s) => s.id === value);
}

export function getContentSection(id: string): ContentSection | undefined {
  return CONTENT_SECTIONS.find((s) => s.id === id);
}
