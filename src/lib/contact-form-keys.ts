/** Claves persistidas en BD y enviadas por el cliente */
export const CONTACT_FORM_KEYS = [
  "contacto-corto",
  "aplicacion-inicio",
  "contacto-evolucion",
  "aplicacion-expansion",
  "servicios-info",
  "oraculo-raiz",
] as const;

export type ContactFormKey = (typeof CONTACT_FORM_KEYS)[number];

export function isContactFormKey(s: string): s is ContactFormKey {
  return (CONTACT_FORM_KEYS as readonly string[]).includes(s);
}

/** Etiquetas para el panel admin */
export const CONTACT_FORM_LABELS: Record<ContactFormKey, string> = {
  "contacto-corto": "Contacto — formulario corto",
  "aplicacion-inicio": "¿En qué momento? — Estoy comenzando (aplicación)",
  "contacto-evolucion": "¿En qué momento? — Necesito evolucionar (contacto)",
  "aplicacion-expansion": "¿En qué momento? — Busco expandirme (aplicación)",
  "servicios-info": "Servicios — +MAS INFO",
  "oraculo-raiz": "Oráculo Raíz — compra",
};

/** Estados de lead en el panel */
export const LEAD_STATUSES = ["nuevo", "contactado", "archivado"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  archivado: "Archivado",
};
