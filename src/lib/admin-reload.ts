import {
  markAdminUploadReloadPending,
  showAdminReloadOverlay,
} from "@/lib/admin-reload-overlay";
import {
  rememberAdminScrollForPageReload,
  rememberAdminScrollForReload,
} from "@/lib/admin-main-scroll";

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
  phaseKey?: string;
  brandKitCardId?: string;
  message?: string;
  detail?: string;
  delayMs?: number;
};

/**
 * F5 controlado: mantiene etapa, card, scroll y muestra overlay durante la recarga.
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
    rememberAdminScrollForReload(projectId);
  }
  if (projectId && opts?.brandKitCardId) {
    rememberBrandKitCardForReload(projectId, opts.brandKitCardId);
  }

  const title = opts?.message ?? "Archivo guardado";
  const detail =
    opts?.detail ?? "Actualizando la vista y volviendo al mismo lugar del proyecto…";

  markAdminUploadReloadPending({
    message: title,
    detail,
    phaseKey: phaseKey ?? undefined,
    brandKitCardId: opts?.brandKitCardId,
  });
  showAdminReloadOverlay(title, detail);

  const hash = phaseKey ? `#fase-${phaseKey}` : window.location.hash || "";
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(null, "", nextUrl);

  const reload = () => window.location.reload();
  const delay = opts?.delayMs ?? 120;
  if (delay > 0) window.setTimeout(reload, delay);
  else reload();
}

/** Recarga simple (portfolio admin, etc.) — conserva URL y scroll. */
export function reloadAdminPage(opts?: { message?: string; detail?: string; delayMs?: number }): void {
  if (typeof window === "undefined") return;

  rememberAdminScrollForPageReload();
  const title = opts?.message ?? "Archivo guardado";
  const detail = opts?.detail ?? "Actualizando la vista…";
  markAdminUploadReloadPending({ message: title, detail });
  showAdminReloadOverlay(title, detail);

  const reload = () => window.location.reload();
  const delay = opts?.delayMs ?? 120;
  if (delay > 0) window.setTimeout(reload, delay);
  else reload();
}
