import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_TESTIMONIALS } from "@/data/default-testimonials";
import { prisma } from "@/lib/prisma";

export type Testimonial = {
  brand: string;
  body: string;
  /** Solo en registros de BD; usado para enlazar con fichas de portfolio */
  projectSlug?: string;
};

/**
 * Formato legacy: bloques con título en `**Marca**` y cuerpo en líneas siguientes
 * (ver `testimonials/testimonials.md`).
 */
export function parseTestimonialsMd(md: string): Testimonial[] {
  const items: Testimonial[] = [];
  const headerRe = /^\s*\*\*(.+?)\*\*\s*$/;
  let currentBrand: string | null = null;
  let currentBody: string[] = [];

  for (const line of md.split(/\r?\n/)) {
    const m = line.match(headerRe);
    if (m) {
      if (currentBrand) {
        const body = currentBody.join("\n").trim();
        items.push({ brand: currentBrand, body });
      }
      currentBody = [];
      currentBrand = m[1]!.trim();
    } else if (currentBrand) {
      currentBody.push(line);
    }
  }
  if (currentBrand) {
    const body = currentBody.join("\n").trim();
    items.push({ brand: currentBrand, body });
  }
  return items;
}

const FILE = "testimonials.md";

/** Relación explícita slug de ficha → criterio sobre el título del .md (fallback legacy) */
const SLUG_TESTIMONIAL_MATCH: { pattern: RegExp; matchBrand: (brand: string) => boolean }[] = [
  { pattern: /^cic-roasters$/, matchBrand: (b) => /cic/i.test(b) },
  { pattern: /^signa-lm$/, matchBrand: (b) => /signa/i.test(b) },
  { pattern: /^ajna-encuadernaciones$/, matchBrand: (b) => /ajna/i.test(b) },
  { pattern: /^play-arch-lab$/, matchBrand: (b) => /pla/i.test(b) && /arch/i.test(b) },
  { pattern: /^fusion-studio$/, matchBrand: (b) => /fusion/i.test(b) },
  { pattern: /^otex$/, matchBrand: (b) => /otex/i.test(b) },
];

/** Inferir slug de portfolio a partir del nombre de marca (importación desde .md) */
export function inferProjectSlugFromBrand(brand: string): string | null {
  for (const row of SLUG_TESTIMONIAL_MATCH) {
    if (row.matchBrand(brand)) {
      const match = row.pattern.source.replace(/^\^|\$$/g, "");
      return match;
    }
  }
  return null;
}

async function getTestimonialsFromFile(): Promise<Testimonial[]> {
  const filePath = path.join(process.cwd(), "testimonials", FILE);
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = parseTestimonialsMd(raw);
    return parsed.length > 0 ? parsed : DEFAULT_TESTIMONIALS;
  } catch {
    return DEFAULT_TESTIMONIALS;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { brand: true, body: true, projectSlug: true },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        brand: r.brand,
        body: r.body,
        projectSlug: r.projectSlug || undefined,
      }));
    }
  } catch (error) {
    console.warn("[testimonials] DB unavailable, falling back to file.", error);
  }
  return getTestimonialsFromFile();
}

export function findTestimonialForProjectSlug(slug: string, items: Testimonial[]): Testimonial | null {
  const bySlug = items.find((t) => t.projectSlug === slug);
  if (bySlug) return bySlug;

  const row = SLUG_TESTIMONIAL_MATCH.find((r) => r.pattern.test(slug));
  if (!row) return null;
  return items.find((t) => row.matchBrand(t.brand)) ?? null;
}
