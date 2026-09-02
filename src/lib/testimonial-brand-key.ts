/** Clave estable para detectar la misma marca entre registros. */
export function testimonialBrandKey(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
