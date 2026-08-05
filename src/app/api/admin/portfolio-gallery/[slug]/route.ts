import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth-api";
import { isPortfolioManualItem, PORTFOLIO_MANUAL_FILENAME } from "@/lib/portfolio-brand-name";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const rows = await prisma.portfolioGalleryItem.findMany({
    where: { slug },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const manualRow = rows.find((r) => isPortfolioManualItem(r.fileName));
  const items = rows.filter((r) => !isPortfolioManualItem(r.fileName));
  return NextResponse.json({
    items,
    manualPdf: manualRow
      ? { url: manualRow.url, fileName: manualRow.fileName === PORTFOLIO_MANUAL_FILENAME ? "manual-de-marca.pdf" : manualRow.fileName }
      : null,
  });
}

const portfolioMediaUrlSchema = z
  .string()
  .min(1)
  .max(2000)
  .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
    message: "URL inválida",
  });

const createSchema = z.object({
  url: portfolioMediaUrlSchema,
  fileName: z.string().max(500).optional(),
  mime: z.string().max(120).optional(),
  sortOrder: z.number().int().optional(),
});

export async function POST(req: Request, ctx: RouteParams) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const maxOrder = await prisma.portfolioGalleryItem.aggregate({
    where: { slug },
    _max: { sortOrder: true },
  });

  const item = await prisma.portfolioGalleryItem.create({
    data: {
      slug,
      url: parsed.data.url,
      fileName: parsed.data.fileName ?? "",
      mime: parsed.data.mime ?? "image/jpeg",
      sortOrder: parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(item);
}
