/**
 * Tokens UI alineados al sitio público (minimal, aire, navy + acento rosa).
 */
export { brandSansStack, brandSerifStack, brandSerifStackEmail } from "@/lib/brand-typography";

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

/** Marco visual para paneles / editores que el cliente ve o recibe. */
export const clientFrame = {
  border: "#F03172",
  background: "rgba(240, 49, 114, 0.02)",
  headerBackground: "rgba(240, 49, 114, 0.06)",
} as const;
