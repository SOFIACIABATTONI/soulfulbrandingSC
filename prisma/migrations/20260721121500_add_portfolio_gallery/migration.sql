-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN "portfolioSlug" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "PortfolioGalleryItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "mime" TEXT NOT NULL DEFAULT 'image/jpeg',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioGalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioGalleryItem_slug_idx" ON "PortfolioGalleryItem"("slug");
