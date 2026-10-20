import { prisma } from "@/lib/prisma";
import {
  applyOraculoPaymentLinkToBlocks,
  buildDefaultOraculoPageContent,
  parseOraculoPageContent,
  resolveOraculoPresentationVideoUrlFromContent,
  type OraculoMediaUrls,
  type OraculoPageContentData,
} from "@/lib/oraculo-page-content";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";

export type OraculoPublicPageData = {
  blocks: OraculoBlock[];
  videoUrl: string;
  media: OraculoMediaUrls;
  /** true si hay fila guardada en BD con bloques */
  fromDatabase: boolean;
};

export async function getOraculoPageContentRow(): Promise<OraculoPageContentData | null> {
  try {
    const row = await prisma.oraculoPageContent.findUnique({ where: { id: 1 } });
    if (!row?.data) return null;
    return parseOraculoPageContent(row.data);
  } catch (error) {
    console.warn("[oraculo-content] DB read failed", error);
    return null;
  }
}

export async function saveOraculoPageContent(data: OraculoPageContentData): Promise<void> {
  const parsed = parseOraculoPageContent(data);
  await prisma.oraculoPageContent.upsert({
    where: { id: 1 },
    create: { id: 1, data: parsed as object },
    update: { data: parsed as object },
  });
}

export async function getOraculoPublicPageData(paymentLink: string): Promise<OraculoPublicPageData> {
  const stored = await getOraculoPageContentRow();
  if (stored && stored.blocks.length > 0) {
    return {
      blocks: applyOraculoPaymentLinkToBlocks(stored.blocks, paymentLink),
      videoUrl: resolveOraculoPresentationVideoUrlFromContent(stored),
      media: stored.media,
      fromDatabase: true,
    };
  }

  const defaults = buildDefaultOraculoPageContent(paymentLink);
  return {
    blocks: defaults.blocks,
    videoUrl: resolveOraculoPresentationVideoUrlFromContent(defaults),
    media: defaults.media,
    fromDatabase: false,
  };
}
