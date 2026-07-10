const ADMIN_SCROLL_MARGIN = 96;

export function getAdminScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const main = document.querySelector("main");
  return main instanceof HTMLElement ? main : null;
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

function syncPhaseHashInUrl(hash: string): void {
  if (typeof window === "undefined") return;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

/** Navega a una fase sin usar location.hash (evita scroll roto del navegador). */
export function navigateAdminToPhaseHash(phaseKey: string): void {
  if (typeof window === "undefined") return;
  const hash = `#fase-${phaseKey}`;
  syncPhaseHashInUrl(hash);

  const run = () => scrollAdminMainToHash(hash, "smooth");
  run();
  window.requestAnimationFrame(run);
  window.setTimeout(run, 120);
  window.setTimeout(run, 400);
  window.setTimeout(run, 900);
}

export function scheduleAdminScrollToHash(hash: string): void {
  if (!hash.startsWith("#")) return;
  const run = () => scrollAdminMainToHash(hash, "auto");
  run();
  window.requestAnimationFrame(run);
  window.setTimeout(run, 80);
  window.setTimeout(run, 280);
  window.setTimeout(run, 700);
}
