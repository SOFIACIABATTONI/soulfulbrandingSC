/**
 * Tokens UI alineados al sitio público (minimal, aire, navy + acento rosa).
 * Sustituto temporal hasta fuentes del manual (.woff2).
 */
export const brandUi = {
  page: "#F2F2F2",
  surface: "#FFFFFF",
  text: "#131945",
  textMuted: "rgba(19, 25, 69, 0.52)",
  textFaint: "rgba(19, 25, 69, 0.38)",
  border: "rgba(19, 25, 69, 0.1)",
  borderStrong: "rgba(19, 25, 69, 0.18)",
  accent: "#F03172",
  accentSoft: "rgba(240, 49, 114, 0.1)",
  navySoft: "rgba(19, 25, 69, 0.06)",
  sky: "#C9E2FF",
  blue: "#323FF6",
} as const;

/** Sans stack — Helvetica en Mac; fallbacks multiplataforma */
export const brandSansStack =
  '"Helvetica Neue", Helvetica, "Segoe UI", Roboto, Arial, sans-serif';

/** Serif stack — EB Garamond cargada en layout; Apple Garamond en Mac */
export const brandSerifStack =
  'var(--font-garamond), "Apple Garamond", Georgia, serif';
