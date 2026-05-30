/** Born & Be Brand ID — deck visual (12 diapositivas, SB® BBB 2026). */
export const BBB_DECK_SLIDES = [
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
] as const;

/** Inversión total referencia PDF (Etapa 1 + Etapa 2). */
export const BBB_DEFAULT_TOTAL_USD = 2411;

export function isBbbDeckFormat(format: string | undefined): boolean {
  return format === "bbb-deck-2026";
}
