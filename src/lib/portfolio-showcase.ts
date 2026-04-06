/**
 * Brand's (/portfolio). `id` coincide con la carpeta en `public/portfolio-media/<id>/`.
 * Portadas: `public/portfolio-media/portadas/cover-*-logo.*`
 */
export type PortfolioShowcaseItem = {
  id: string;
  title: string;
  /** Ruta bajo `public/` (p. ej. `/portfolio-media/portadas/...`) */
  cover: string;
  href?: string | null;
  showText?: boolean;
  category?: string;
  excerpt?: string;
};

/** Orden tipo mockup (filas izq → der, arriba → abajo). 11 portadas. */
export const PORTFOLIO_SHOWCASE: PortfolioShowcaseItem[] = [
  { id: "ajna-encuadernaciones", title: "Ajna Encuadernaciones", cover: "/portfolio-media/portadas/cover-ajna-logo.jpeg" },
  { id: "cic-roasters", title: "CIC Roasters", cover: "/portfolio-media/portadas/cover-cic-logo.png" },
  { id: "carla-scaramuzza", title: "Carla Scaramuzza", cover: "/portfolio-media/portadas/cover-carla-scaramuzza-logo.png" },
  { id: "play-arch-lab", title: "PLA Arch Lab", cover: "/portfolio-media/portadas/cover-play-arch-lab-logo.png" },
  { id: "fusion-studio", title: "Fusion Studio", cover: "/portfolio-media/portadas/cover-fusion-logo.png" },
  { id: "lanucci", title: "Lanucci", cover: "/portfolio-media/portadas/cover-lanucci-logo.png" },
  { id: "signa-lm", title: "SIGNA", cover: "/portfolio-media/portadas/cover-signa-logo.png" },
  { id: "supernova", title: "Supernova", cover: "/portfolio-media/portadas/cover-supernova-logo.png" },
  { id: "botanico-petit-hotel", title: "Botánico Petit Hotel", cover: "/portfolio-media/portadas/cover-botanico-logo.png" },
  { id: "marian-pacheco", title: "Marian Pacheco", cover: "/portfolio-media/portadas/cover-marian-pacheco-logo.png" },
  { id: "malena-rinuado", title: "Malena Rinaudo", cover: "/portfolio-media/portadas/cover-malena-rinaudo-logo.png" },
];
