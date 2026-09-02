import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { inferProjectSlugFromBrand, parseTestimonialsMd } from "@/lib/testimonials";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.testimonial.count();
  if (existing > 0) {
    return NextResponse.json(
      { error: "Ya hay testimonios en la base. Eliminá los existentes antes de importar." },
      { status: 409 },
    );
  }

  const filePath = path.join(process.cwd(), "testimonials", "testimonials.md");
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return NextResponse.json({ error: "No se encontró testimonials/testimonials.md" }, { status: 404 });
  }

  const parsed = parseTestimonialsMd(raw);
  if (parsed.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene testimonios válidos" }, { status: 400 });
  }

  const created = await prisma.$transaction(
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

  return NextResponse.json({ ok: true, count: created.length });
}
