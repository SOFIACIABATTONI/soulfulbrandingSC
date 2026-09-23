export const BBB_BRAND_IMAGE = {
  src: "/quotes/bbb-brand-2026/bbb-brand-low-ticket.jpg?v=20260923",
  alt: "Brand — propuesta Born & Be, Método Soulful Branding®",
} as const;

export function isBbbBrandFormat(format: string | undefined): boolean {
  return format === "bbb-brand-2026";
}
