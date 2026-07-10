const ADMIN_SCROLL_MARGIN = 96;

export function getAdminScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const main = document.querySelector("main");
  return main instanceof HTMLElement ? main : null;
}

/** Desplaza el scroll del panel admin (`main`) hasta una ancla `#fase-*`. */
export function scrollAdminMainToHash(
  hash: string,
  behavior: ScrollBehavior = "smooth",
): boolean {
  if (!hash.startsWith("#")) return false;
  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) return false;

  const main = getAdminScrollContainer();
  if (main && main.scrollHeight > main.clientHeight + 1) {
    const mainRect = main.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = main.scrollTop + (targetRect.top - mainRect.top) - ADMIN_SCROLL_MARGIN;
    main.scrollTo({ top: Math.max(0, nextTop), behavior });
    return true;
  }

  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function navigateAdminToPhaseHash(phaseKey: string): void {
  if (typeof window === "undefined") return;
  const hash = `#fase-${phaseKey}`;
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
  window.requestAnimationFrame(() => scrollAdminMainToHash(hash));
  window.setTimeout(() => scrollAdminMainToHash(hash), 120);
}
