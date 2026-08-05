import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PORTFOLIO_SHOWCASE, type PortfolioShowcaseItem } from "@/lib/portfolio-showcase";

export function projectToShowcaseItem(p: Pick<Project, "slug" | "title" | "imageUrl" | "category" | "excerpt">): PortfolioShowcaseItem {
  return {
    id: p.slug,
    title: p.title,
    cover: p.imageUrl?.trim() || "/portfolio-media/portadas/cover-fusion-logo.png",
    category: p.category?.trim() || undefined,
    excerpt: p.excerpt?.trim() || undefined,
    showText: Boolean(p.category?.trim() || p.excerpt?.trim()),
  };
}

const STATIC_IDS = new Set(PORTFOLIO_SHOWCASE.map((i) => i.id));

/** Showcase estático + proyectos publicados en BD (sin duplicar slugs estáticos). */
export async function getPortfolioShowcaseItems(): Promise<PortfolioShowcaseItem[]> {
  const published = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { slug: true, title: true, imageUrl: true, category: true, excerpt: true },
  });

  const fromDb = published
    .filter((p) => !STATIC_IDS.has(p.slug))
    .map((p) => projectToShowcaseItem(p));

  return [...PORTFOLIO_SHOWCASE, ...fromDb];
}
