import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { inferProjectSlugFromBrand, parseTestimonialsMd } from "@/lib/testimonials";

const FILE = "testimonials.md";

function brandKey(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/®/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readTestimonialsMd(): Promise<ReturnType<typeof parseTestimonialsMd>> {
  const filePath = path.join(process.cwd(), "testimonials", FILE);
  try {
    const raw = await readFile(filePath, "utf-8");
    return parseTestimonialsMd(raw);
  } catch {
    return [];
  }
}

/**
 * Asegura que los testimonios del .md legacy existan en BD.
 * No borra ni pisa los que ya están (p. ej. creados desde el panel).
 */
export async function syncTestimonialsFromMd(): Promise<number> {
  const parsed = await readTestimonialsMd();
  if (parsed.length === 0) return 0;

  const existing = await prisma.testimonial.findMany({
    select: { brand: true },
  });
  const existingKeys = new Set(existing.map((row) => brandKey(row.brand)));

  const missing = parsed.filter((item) => !existingKeys.has(brandKey(item.brand)));
  if (missing.length === 0) return 0;

  const maxOrder = await prisma.testimonial.aggregate({ _max: { sortOrder: true } });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  await prisma.$transaction(
    missing.map((item) => {
      const sortOrder = nextOrder++;
      return prisma.testimonial.create({
        data: {
          brand: item.brand,
          body: item.body,
          sortOrder,
          published: true,
          projectSlug: inferProjectSlugFromBrand(item.brand) ?? "",
        },
      });
    }),
  );

  return missing.length;
}

/** @deprecated Usar syncTestimonialsFromMd */
export async function seedTestimonialsFromMdIfEmpty(): Promise<number> {
  return syncTestimonialsFromMd();
}
