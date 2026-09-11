export const SOUL_BRAND_MAP_IMAGE = {
  src: "/quotes/soul-brand-map-2026/soul-brand-map.jpg",
  alt: "Soul Brand Map — mapa estratégico de marca",
} as const;

export function isSoulBrandMapFormat(format: string | undefined): boolean {
  return format === "soul-brand-map-2026";
}
