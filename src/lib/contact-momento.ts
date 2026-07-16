import type { StageFormId } from "@/lib/site-content";

/** Clave legacy; se borra al cargar contacto sin `formulario` en la URL */
export const SB_MOMENTO_STORAGE_KEY = "sb-contact-momento-v1";

export type MomentoStored = { formId: StageFormId; etapaTitle: string };

/** Limpia datos viejos de sessionStorage (ya no se usan para elegir formulario). */
export function clearLegacyMomentoStorage() {
  try {
    sessionStorage.removeItem(SB_MOMENTO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export type ContactMomentoQuery = {
  etapa: string;
  /** Legacy: ya no abre formulario largo; sirve para inferir etapa en URLs viejas */
  formulario: string;
  /** Servicio elegido desde la sección Servicios (+INFO) */
  servicio: string;
};

/**
 * Resuelve etapa / servicio desde la URL y `initialQuery` (SSR).
 * El sitio público usa siempre el formulario de contacto corto.
 */
export function resolveMomentoQuery(
  nextSearchParams: URLSearchParams,
  initialQuery: { etapa?: string; formulario?: string; servicio?: string } | undefined,
): ContactMomentoQuery {
  let etapa = nextSearchParams.get("etapa")?.trim() || "";
  let formulario = nextSearchParams.get("formulario")?.trim() || "";
  let servicio = nextSearchParams.get("servicio")?.trim() || "";

  if (typeof window !== "undefined") {
    const w = new URLSearchParams(window.location.search);
    if (!etapa) etapa = w.get("etapa")?.trim() || "";
    if (!formulario) formulario = w.get("formulario")?.trim() || "";
    if (!servicio) servicio = w.get("servicio")?.trim() || "";
  }

  if (!etapa) etapa = initialQuery?.etapa?.trim() || "";
  if (!formulario) formulario = initialQuery?.formulario?.trim() || "";
  if (!servicio) servicio = initialQuery?.servicio?.trim() || "";

  return { etapa, formulario, servicio };
}
