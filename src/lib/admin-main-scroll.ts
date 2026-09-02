const ADMIN_SCROLL_MARGIN = 96;

export const ADMIN_PHASE_NAVIGATE_EVENT = "admin-phase-navigate";

export function dispatchAdminPhaseNavigate(phaseKey: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ADMIN_PHASE_NAVIGATE_EVENT, { detail: { phaseKey } }),
  );
}

export function getAdminScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const main = document.querySelector("main");
  return main instanceof HTMLElement ? main : null;
}

/** Vuelve al inicio del panel admin (p. ej. al cerrar detalle de etapa). */
export function scrollAdminMainToTop(behavior: ScrollBehavior = "auto"): void {
  const main = getAdminScrollContainer();
  if (main) main.scrollTo({ top: 0, behavior });
}

/** Desplaza el scroll del panel admin (`main`) hasta un elemento. */
export function scrollAdminMainToElement(
  target: HTMLElement,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const main = getAdminScrollContainer();
  if (!main) {
    target.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  const mainRect = main.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = main.scrollTop + (targetRect.top - mainRect.top) - ADMIN_SCROLL_MARGIN;
  main.scrollTo({ top: Math.max(0, nextTop), behavior });
  return true;
}

/** Desplaza el scroll del panel admin (`main`) hasta una ancla `#fase-*`. */
export function scrollAdminMainToHash(
  hash: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  if (!hash.startsWith("#")) return false;
  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) return false;
  return scrollAdminMainToElement(target, behavior);
}

/** Espera a que exista el ancla (p. ej. tras montar la etapa activa) y entonces hace scroll. */
export function waitForAdminScrollToHash(
  hash: string,
  behavior: ScrollBehavior = "auto",
  maxWaitMs = 2500,
): void {
  if (!hash.startsWith("#")) return;
  const start = performance.now();
  const attempt = () => {
    if (scrollAdminMainToHash(hash, behavior)) return;
    if (performance.now() - start < maxWaitMs) {
      requestAnimationFrame(attempt);
    }
  };
  attempt();
}

function syncPhaseHashInUrl(hash: string): void {
  if (typeof window === "undefined") return;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

/** Navega a una fase: actualiza URL y avisa al workspace (el scroll lo hace el panel al montar). */
export function navigateAdminToPhaseHash(phaseKey: string): void {
  if (typeof window === "undefined") return;
  const hash = `#fase-${phaseKey}`;
  syncPhaseHashInUrl(hash);
  dispatchAdminPhaseNavigate(phaseKey);
}

export function scheduleAdminScrollToHash(hash: string): void {
  if (!hash.startsWith("#")) return;
  waitForAdminScrollToHash(hash, "auto");
}

const SCROLL_RESTORE_PREFIX = "erp-upload-scroll:";

/** Guarda scroll del panel `main` antes de un reload post-subida. */
export function rememberAdminScrollForReload(projectId: string): void {
  if (typeof window === "undefined") return;
  const main = getAdminScrollContainer();
  if (!main) return;
  try {
    sessionStorage.setItem(`${SCROLL_RESTORE_PREFIX}${projectId}`, String(Math.round(main.scrollTop)));
  } catch {
    /* ignore */
  }
}

export function consumeAdminScrollForReload(projectId: string): number | null {
  try {
    const raw = sessionStorage.getItem(`${SCROLL_RESTORE_PREFIX}${projectId}`);
    sessionStorage.removeItem(`${SCROLL_RESTORE_PREFIX}${projectId}`);
    if (!raw) return null;
    const top = Number(raw);
    return Number.isFinite(top) ? top : null;
  } catch {
    return null;
  }
}

/** Restaura el scroll del panel admin tras un reload post-subida. */
export function restoreAdminScrollPosition(projectId: string): boolean {
  const top = consumeAdminScrollForReload(projectId);
  if (top == null) return false;
  const main = getAdminScrollContainer();
  if (!main) return false;
  main.scrollTo({ top, behavior: "auto" });
  return true;
}

/** Guarda scroll genérico (portfolio admin, etc.). */
export function rememberAdminScrollForPageReload(): void {
  if (typeof window === "undefined") return;
  const main = getAdminScrollContainer();
  const top = main ? main.scrollTop : window.scrollY;
  try {
    sessionStorage.setItem(`${SCROLL_RESTORE_PREFIX}page`, String(Math.round(top)));
  } catch {
    /* ignore */
  }
}

export function restoreAdminScrollPositionForPage(): boolean {
  try {
    const raw = sessionStorage.getItem(`${SCROLL_RESTORE_PREFIX}page`);
    sessionStorage.removeItem(`${SCROLL_RESTORE_PREFIX}page`);
    if (!raw) return false;
    const top = Number(raw);
    if (!Number.isFinite(top)) return false;
    const main = getAdminScrollContainer();
    if (main) {
      main.scrollTo({ top, behavior: "auto" });
    } else {
      window.scrollTo({ top, behavior: "auto" });
    }
    return true;
  } catch {
    return false;
  }
}
