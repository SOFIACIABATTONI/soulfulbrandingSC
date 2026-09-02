const ERP_PHASE_SESSION_PREFIX = "erp-active-phase:";
const ERP_BRAND_KIT_CARD_PREFIX = "erp-brandkit-card:";

/** ID del proyecto ERP desde `/admin/proyectos/[id]`. */
export function getErpProjectIdFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/admin\/proyectos\/([^/]+)/);
  return match?.[1] ?? null;
}

export function getPhaseKeyFromLocationHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.startsWith("#fase-")) return hash.slice("#fase-".length);
  return null;
}

export function rememberBrandKitCardForReload(projectId: string, cardId: string): void {
  sessionStorage.setItem(`${ERP_BRAND_KIT_CARD_PREFIX}${projectId}`, cardId);
}

/** Lee y borra la card a reabrir tras un reload (Brand ID). */
export function consumeRememberedBrandKitCard(projectId: string): string | null {
  const key = `${ERP_BRAND_KIT_CARD_PREFIX}${projectId}`;
  const cardId = sessionStorage.getItem(key);
  if (cardId) sessionStorage.removeItem(key);
  return cardId;
}

type ReloadAdminWorkspaceOptions = {
  /** Etapa ERP (`identidad`, `manual`, …). Por defecto: hash `#fase-*` o sessionStorage. */
  phaseKey?: string;
  /** Card de Brand ID a reabrir tras el reload. */
  brandKitCardId?: string;
  /** Breve pausa para mostrar el 100 % antes de recargar. */
  delayMs?: number;
};

/**
 * F5 controlado: mantiene pathname, hash de etapa y (opcional) card activa en Brand ID.
 * Evita pantallas trabadas tras subir imágenes en el ERP.
 */
export function reloadAdminWorkspacePreserveContext(opts?: ReloadAdminWorkspaceOptions): void {
  if (typeof window === "undefined") return;

  const projectId = getErpProjectIdFromPath();
  const phaseKey =
    opts?.phaseKey ??
    getPhaseKeyFromLocationHash() ??
    (projectId ? sessionStorage.getItem(`${ERP_PHASE_SESSION_PREFIX}${projectId}`) : null);

  if (projectId && phaseKey) {
    sessionStorage.setItem(`${ERP_PHASE_SESSION_PREFIX}${projectId}`, phaseKey);
  }
  if (projectId && opts?.brandKitCardId) {
    rememberBrandKitCardForReload(projectId, opts.brandKitCardId);
  }

  const hash = phaseKey ? `#fase-${phaseKey}` : window.location.hash || "";
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", nextUrl);

  const reload = () => {
    window.location.reload();
  };

  const delay = opts?.delayMs ?? 450;
  if (delay > 0) {
    window.setTimeout(reload, delay);
  } else {
    reload();
  }
}

/** Recarga simple (portfolio admin, etc.) — conserva URL actual. */
export function reloadAdminPage(delayMs = 450): void {
  if (typeof window === "undefined") return;
  const reload = () => window.location.reload();
  if (delayMs > 0) window.setTimeout(reload, delayMs);
  else reload();
}
