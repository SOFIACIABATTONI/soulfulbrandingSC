import { prisma } from "@/lib/prisma";
import { isPortfolioManualItem, PORTFOLIO_MANUAL_FILENAME } from "@/lib/portfolio-brand-name";

export type DbGalleryItem = {
  id: string;
  url: string;
  fileName: string;
  mime: string;
  kind: "image" | "video";
};

export type DbPortfolioGalleryContent = {
  manualPdf: { url: string; fileName: string } | null;
  images: DbGalleryItem[];
};

/** La portada (`Project.imageUrl`) no forma parte de la galería publicada. */
export function filterPortfolioGalleryExcludeCover<T extends { url: string }>(
  items: T[],
  coverUrl: string | null | undefined,
): T[] {
  const cover = coverUrl?.trim();
  if (!cover) return items;
  return items.filter((item) => item.url.trim() !== cover);
}

export async function getDbPortfolioGalleryContent(slug: string): Promise<DbPortfolioGalleryContent> {
  const rows = await prisma.portfolioGalleryItem.findMany({
    where: { slug },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  let manualPdf: DbPortfolioGalleryContent["manualPdf"] = null;
  const images: DbGalleryItem[] = [];

  for (const r of rows) {
    if (isPortfolioManualItem(r.fileName)) {
      if (!manualPdf) {
        manualPdf = {
          url: r.url,
          fileName: r.fileName === PORTFOLIO_MANUAL_FILENAME ? "manual-de-marca.pdf" : r.fileName,
        };
      }
      continue;
    }
    images.push({
      id: r.id,
      url: r.url,
      fileName: r.fileName,
      mime: r.mime,
      kind: r.mime.startsWith("video/") ? "video" : "image",
    });
  }

  return { manualPdf, images };
}

/** @deprecated Usar getDbPortfolioGalleryContent */
export async function getDbPortfolioGallery(slug: string): Promise<DbGalleryItem[]> {
  const { images } = await getDbPortfolioGalleryContent(slug);
  return images;
}

export async function upsertPortfolioManualPdf(
  slug: string,
  manual: { url: string; fileName: string; mime: string },
): Promise<void> {
  await prisma.portfolioGalleryItem.deleteMany({
    where: { slug, fileName: PORTFOLIO_MANUAL_FILENAME },
  });
  await prisma.portfolioGalleryItem.create({
    data: {
      slug,
      url: manual.url,
      fileName: PORTFOLIO_MANUAL_FILENAME,
      mime: manual.mime || "application/pdf",
      sortOrder: -1,
    },
  });
}
