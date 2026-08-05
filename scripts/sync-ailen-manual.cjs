require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PORTFOLIO_MANUAL_FILENAME = "__manual-de-marca__";

async function syncManual(slug) {
  const cp = await prisma.clientProject.findFirst({
    where: { portfolioSlug: slug },
    select: { phases: true },
  });
  if (!cp) throw new Error("No ERP linked");

  const manual = cp.phases?.manual || {};
  const url = (manual.manualPdfUrl || "").trim();
  if (!url) throw new Error("No manual in ERP");

  await prisma.portfolioGalleryItem.deleteMany({
    where: { slug, fileName: PORTFOLIO_MANUAL_FILENAME },
  });
  await prisma.portfolioGalleryItem.create({
    data: {
      slug,
      url,
      fileName: PORTFOLIO_MANUAL_FILENAME,
      mime: (manual.manualPdfMime || "application/pdf").trim() || "application/pdf",
      sortOrder: -1,
    },
  });
  console.log("Synced manual for", slug, "->", url);
}

syncManual("identidad-de-marca-ailen-sampo")
  .catch(console.error)
  .finally(() => prisma.$disconnect());
