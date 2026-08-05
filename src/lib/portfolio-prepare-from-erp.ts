import type { ClientProject } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { brandKitFromPhaseData, cardHasContent, deliverableCardFiles } from "@/lib/brand-kit";
import { derivePortfolioBrandName, derivePortfolioBrandSlug } from "@/lib/portfolio-brand-name";
import { PORTFOLIO_SHOWCASE } from "@/lib/portfolio-showcase";
import { ensureUniqueProjectSlug } from "@/lib/portfolio-slug";
import { parseProjectPhases } from "@/lib/prebrief-service";

const STATIC_IDS = new Set(PORTFOLIO_SHOWCASE.map((i) => i.id));

type ErpProjectForPortfolio = ClientProject & {
  client?: { name: string; company: string } | null;
};

function phaseRecord(phases: unknown): Record<string, Record<string, string>> {
  return parseProjectPhases(phases);
}

/** Portada para la card en /portfolio (no el hero de la ficha). */
function pickCardCoverImage(phases: Record<string, Record<string, string>>): string {
  for (const key of ["manual", "identidad", "narrativa"] as const) {
    const url = phases[key]?.coverUrl?.trim();
    if (url && !url.toLowerCase().endsWith(".pdf")) return url;
  }
  const identidad = phases.identidad ?? {};
  const kit = brandKitFromPhaseData(identidad);
  for (const card of kit.cards) {
    if (!cardHasContent(card)) continue;
    const file = deliverableCardFiles(card).find((f) => f.mime.startsWith("image/"));
    if (file?.url) return file.url;
  }
  return "";
}

export async function preparePortfolioDraftFromErp(clientProject: ErpProjectForPortfolio): Promise<{
  slug: string;
  projectId: string;
  created: boolean;
  brandName: string;
}> {
  const phases = phaseRecord(clientProject.phases);

  const brandName = derivePortfolioBrandName({
    title: clientProject.title,
    service: clientProject.service,
    client: clientProject.client,
  });

  const existingSlug =
    "portfolioSlug" in clientProject
      ? String((clientProject as ClientProject & { portfolioSlug?: string }).portfolioSlug ?? "").trim()
      : "";

  let slug = existingSlug;
  if (!slug) {
    const preferred = derivePortfolioBrandSlug({
      title: clientProject.title,
      service: clientProject.service,
      client: clientProject.client,
    });
    slug = await ensureUniqueProjectSlug(preferred || brandName, async (candidate) => {
      if (STATIC_IDS.has(candidate)) return true;
      const found = await prisma.project.findUnique({ where: { slug: candidate } });
      return Boolean(found);
    });
  }

  const cardCover = pickCardCoverImage(phases);
  const existing = await prisma.project.findUnique({ where: { slug } });

  const project = existing
    ? await prisma.project.update({
        where: { id: existing.id },
        data: {
          title: brandName,
          ...(cardCover && !existing.imageUrl?.trim() ? { imageUrl: cardCover } : {}),
        },
      })
    : await prisma.project.create({
        data: {
          title: brandName,
          slug,
          excerpt: "",
          description: "",
          imageUrl: cardCover,
          category: "",
          order: 0,
          published: false,
        },
      });

  await prisma.clientProject.update({
    where: { id: clientProject.id },
    data: { portfolioSlug: slug },
  });

  return { slug, projectId: project.id, created: !existing, brandName };
}
