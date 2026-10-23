/**
 * Textos de error/aviso en el admin que usa la clienta (Sofía).
 * Sin jerga de desarrollo: Vercel, Neon, Prisma, nombres de migración, npm, redeploy, etc.
 * El detalle técnico va solo en console.error en rutas API / server.
 */

export const ADMIN_SAVE_FAILED =
  "No se pudieron guardar los cambios. Si el problema continúa, avisá a quien mantiene el sitio.";

export const ADMIN_LOAD_FAILED =
  "No se pudo cargar esta sección. Probá de nuevo en unos minutos.";

export const ADMIN_ACTION_FAILED =
  "No se pudo completar la acción. Probá de nuevo o avisá a quien mantiene el sitio.";

/** CMS Oráculo: tabla aún no disponible en esta BD (migración pendiente en deploy). */
export const ADMIN_ORACULO_CMS_NOT_READY =
  "Esta sección todavía no puede guardar cambios en este entorno. La página pública de Oráculo sigue mostrando el contenido habitual hasta que se complete una actualización del sistema.";
