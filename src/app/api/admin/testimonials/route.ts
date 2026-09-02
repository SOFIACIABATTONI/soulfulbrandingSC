import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { PORTFOLIO_SHOWCASE_META } from "@/lib/portfolio-showcase-meta";
import { prepareTestimonialsForAdmin } from "@/lib/testimonials-seed";

const createSchema = z.object({
  brand: z.string().min(1).max(200),
  body: z.string().max(20000),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
  projectSlug: z.string().max(200).optional(),
});

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await prepareTestimonialsForAdmin();

    const [items, dbProjects] = await Promise.all([
      prisma.testimonial.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.project.findMany({
        select: { slug: true, title: true },
        orderBy: [{ order: "asc" }, { title: "asc" }],
      }),
    ]);

    const slugMap = new Map<string, string>();
    for (const row of PORTFOLIO_SHOWCASE_META) {
      slugMap.set(row.slug, row.title);
    }
    for (const row of dbProjects) {
      if (!slugMap.has(row.slug)) slugMap.set(row.slug, row.title);
    }
    const portfolioOptions = [...slugMap.entries()]
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title, "es"));

    return NextResponse.json({ items, portfolioOptions });
  } catch (error) {
    console.error("[api/admin/testimonials][GET]", error);
    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los testimonios. Si acabás de publicar, verificá que la migración de base de datos esté aplicada.",
        items: [],
        portfolioOptions: PORTFOLIO_SHOWCASE_META.map((row) => ({ slug: row.slug, title: row.title })),
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const maxOrder = await prisma.testimonial.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.testimonial.create({
      data: {
        brand: data.brand.trim(),
        body: data.body,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        published: data.published ?? true,
        projectSlug: data.projectSlug?.trim() ?? "",
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("[api/admin/testimonials][POST]", error);
    return NextResponse.json({ error: "No se pudo crear el testimonio." }, { status: 503 });
  }
}
