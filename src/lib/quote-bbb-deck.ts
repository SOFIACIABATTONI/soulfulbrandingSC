export type BbbDeckSlide = { src: string; alt: string };

/** Deck visual Born & Be anterior (12 diapositivas). Presupuestos ya enviados. */
export const BBB_DECK_SLIDES_LEGACY: BbbDeckSlide[] = [
  { src: "/quotes/bbb-2026/pagina_01.jpg", alt: "Born & Be — Método Soulful Branding®" },
  { src: "/quotes/bbb-2026/pagina_02.jpg", alt: "Born and Be — branding estratégico" },
  { src: "/quotes/bbb-2026/pagina_03.jpg", alt: "Acompañamiento creativo y alquimia de marca" },
  { src: "/quotes/bbb-2026/pagina_04.jpg", alt: "Time to bloom" },
  { src: "/quotes/bbb-2026/pagina_05.jpg", alt: "Propuesta de valor Born and Be" },
  { src: "/quotes/bbb-2026/pagina_06.jpg", alt: "De adentro hacia afuera — Método Soulful Branding®" },
  { src: "/quotes/bbb-2026/pagina_07.jpg", alt: "Del cosmos a la vida — Soulful Branding Insights" },
  { src: "/quotes/bbb-2026/pagina_08.jpg", alt: "Narrativa verbal y sistema visual — cuatro etapas" },
  { src: "/quotes/bbb-2026/pagina_09.jpg", alt: "Identidad verbal-visual Born and Be" },
  { src: "/quotes/bbb-2026/pagina_10.jpg", alt: "Alcance, inversión y condiciones de pago" },
  { src: "/quotes/bbb-2026/pagina_11.jpg", alt: "Marcas visionarias — portfolio" },
  { src: "/quotes/bbb-2026/pagina_12.jpg", alt: "It's time to bloom — Born and Be" },
];

/** Deck HT actual (4 diapositivas, sep 2026). */
export const BBB_DECK_SLIDES_HT: BbbDeckSlide[] = [
  { src: "/quotes/bbb-ht-2026/pagina_01.jpg", alt: "Born & Be — Propuesta HT 1" },
  { src: "/quotes/bbb-ht-2026/pagina_02.jpg", alt: "Born & Be — Propuesta HT 2" },
  { src: "/quotes/bbb-ht-2026/pagina_03.jpg", alt: "Born & Be — Propuesta HT 3" },
  { src: "/quotes/bbb-ht-2026/pagina_04.jpg", alt: "Born & Be — Propuesta HT 4" },
];

/** @deprecated Usar getBbbDeckSlides(format) */
export const BBB_DECK_SLIDES = BBB_DECK_SLIDES_HT;

export function getBbbDeckSlides(format: string | undefined): readonly BbbDeckSlide[] {
  if (format === "bbb-deck-2026") return BBB_DECK_SLIDES_LEGACY;
  return BBB_DECK_SLIDES_HT;
}

export function bbbDeckSlideCount(format: string | undefined): number {
  return getBbbDeckSlides(format).length;
}

export function isBbbDeckFormat(format: string | undefined): boolean {
  return format === "bbb-deck-2026" || format === "bbb-deck-ht-2026";
}
