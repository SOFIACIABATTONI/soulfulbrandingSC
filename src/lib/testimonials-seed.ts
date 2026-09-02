import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { inferProjectSlugFromBrand, parseTestimonialsMd } from "@/lib/testimonials";

const FILE = "testimonials.md";

/** Carga testimonios legacy desde el .md si la tabla está vacía. */
export async function seedTestimonialsFromMdIfEmpty(): Promise<number> {
  const existing = await prisma.testimonial.count();
  if (existing > 0) return 0;

  const filePath = path.join(process.cwd(), "testimonials", FILE);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return 0;
  }

  const parsed = parseTestimonialsMd(raw);
  if (parsed.length === 0) return 0;

  await prisma.$transaction(
    parsed.map((item, index) =>
      prisma.testimonial.create({
        data: {
          brand: item.brand,
          body: item.body,
          sortOrder: index,
          published: true,
          projectSlug: inferProjectSlugFromBrand(item.brand) ?? "",
        },
      }),
    ),
  );

  return parsed.length;
}
