import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_TESTIMONIALS } from "@/data/default-testimonials";
import { prisma } from "@/lib/prisma";
import { testimonialBrandKey } from "@/lib/testimonial-brand-key";
import { inferProjectSlugFromBrand, parseTestimonialsMd, type Testimonial } from "@/lib/testimonials";

const FILE = "testimonials.md";

async function readLegacyTestimonials(): Promise<Testimonial[]> {
  const filePath = path.join(process.cwd(), "testimonials", FILE);
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = parseTestimonialsMd(raw);
    return parsed.length > 0 ? parsed : DEFAULT_TESTIMONIALS;
  } catch {
    return DEFAULT_TESTIMONIALS;
  }
}

/** Elimina duplicados por marca (conserva el de menor orden / más antiguo). */
export async function dedupeTestimonials(): Promise<number> {
  const all = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const toDelete: string[] = [];

  const byKey = new Map<string, typeof all>();
  for (const row of all) {
    const key = testimonialBrandKey(row.brand);
    const group = byKey.get(key) ?? [];
    group.push(row);
    byKey.set(key, group);
  }

  for (const group of byKey.values()) {
    if (group.length <= 1) continue;
    const [, ...dupes] = group;
    toDelete.push(...dupes.map((row) => row.id));
  }

  if (toDelete.length === 0) return 0;
  await prisma.testimonial.deleteMany({ where: { id: { in: toDelete } } });
  return toDelete.length;
}

/** Reasigna sortOrder 0…n según el orden actual en BD. */
export async function normalizeTestimonialSortOrder(): Promise<void> {
  const items = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, sortOrder: true },
  });

  const updates = items
    .map((item, index) => (item.sortOrder !== index ? { id: item.id, sortOrder: index } : null))
    .filter((row): row is { id: string; sortOrder: number } => row !== null);

  if (updates.length === 0) return;

  await prisma.$transaction(
    updates.map((row) =>
      prisma.testimonial.update({
        where: { id: row.id },
        data: { sortOrder: row.sortOrder },
      }),
    ),
  );
}

/**
 * Importa testimonios legacy solo si falta esa marca en BD.
 * No corre en rutas públicas — solo admin.
 */
export async function syncTestimonialsFromMd(): Promise<number> {
  const parsed = await readLegacyTestimonials();
  if (parsed.length === 0) return 0;

  const existing = await prisma.testimonial.findMany({
    select: { brand: true, projectSlug: true },
  });
  const existingBrandKeys = new Set(existing.map((row) => testimonialBrandKey(row.brand)));
  const existingSlugs = new Set(existing.map((row) => row.projectSlug).filter(Boolean));

  const missing = parsed.filter((item) => {
    const key = testimonialBrandKey(item.brand);
    if (existingBrandKeys.has(key)) return false;
    const slug = inferProjectSlugFromBrand(item.brand);
    if (slug && existingSlugs.has(slug)) return false;
    return true;
  });

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

/** Limpieza + orden estable al abrir el admin. */
export async function prepareTestimonialsForAdmin(): Promise<void> {
  try {
    await dedupeTestimonials();
  } catch (error) {
    console.error("[testimonials] dedupe failed", error);
  }
  try {
    await syncTestimonialsFromMd();
  } catch (error) {
    console.error("[testimonials] sync failed", error);
  }
  try {
    await normalizeTestimonialSortOrder();
  } catch (error) {
    console.error("[testimonials] normalize sort failed", error);
  }
}

/** @deprecated Usar prepareTestimonialsForAdmin */
export async function seedTestimonialsFromMdIfEmpty(): Promise<number> {
  await prepareTestimonialsForAdmin();
  return 0;
}
