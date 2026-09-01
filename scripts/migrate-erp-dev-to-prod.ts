/**
 * Copia datos ERP de la branch Neon `dev` → `production`.
 *
 * NO toca: SiteContent, Project, ContactMessage (sitio público en prod).
 *
 * Uso (PowerShell):
 *   $env:DEV_DATABASE_URL="postgresql://...branch dev..."
 *   $env:PROD_DATABASE_URL="postgresql://...branch production..."
 *   npx tsx scripts/migrate-erp-dev-to-prod.ts          # solo muestra conteos
 *   npx tsx scripts/migrate-erp-dev-to-prod.ts --apply    # ejecuta la copia
 *
 * Opcional:
 *   --include-gallery   copia también PortfolioGalleryItem
 */

import { PrismaClient } from "@prisma/client";

const ERP_TABLES = [
  "ContractAcceptance",
  "ClientAccessToken",
  "Invoice",
  "ClientProject",
  "Quote",
  "Client",
  "Lead",
] as const;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Falta ${name}. Usá la connection string DIRECTA de Neon (no pooler) para cada branch.`);
    process.exit(1);
  }
  return value;
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return `${u.hostname}${u.pathname}`;
  } catch {
    return "(url inválida)";
  }
}

async function counts(prisma: PrismaClient) {
  return {
    leads: await prisma.lead.count(),
    quotes: await prisma.quote.count(),
    clients: await prisma.client.count(),
    projects: await prisma.clientProject.count(),
    invoices: await prisma.invoice.count(),
    tokens: await prisma.clientAccessToken.count(),
    contracts: await prisma.contractAcceptance.count(),
    gallery: await prisma.portfolioGalleryItem.count(),
    siteContent: await prisma.siteContent.count(),
    portfolio: await prisma.project.count(),
    contacts: await prisma.contactMessage.count(),
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const includeGallery = process.argv.includes("--include-gallery");

  const devUrl = requireEnv("DEV_DATABASE_URL");
  const prodUrl = requireEnv("PROD_DATABASE_URL");

  if (devUrl === prodUrl) {
    console.error("DEV_DATABASE_URL y PROD_DATABASE_URL son iguales. Abortando.");
    process.exit(1);
  }

  const dev = new PrismaClient({ datasources: { db: { url: devUrl } } });
  const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });

  console.log("Origen (dev):", maskUrl(devUrl));
  console.log("Destino (production):", maskUrl(prodUrl));
  console.log(apply ? "\nModo: APLICAR copia\n" : "\nModo: dry-run (agregá --apply para ejecutar)\n");

  const [devCounts, prodCounts] = await Promise.all([counts(dev), counts(prod)]);

  console.log("Conteos en DEV:", devCounts);
  console.log("Conteos en PRODUCTION (antes):", prodCounts);

  if (!apply) {
    console.log("\nSin cambios. Cuando estés listo: npx tsx scripts/migrate-erp-dev-to-prod.ts --apply");
    await dev.$disconnect();
    await prod.$disconnect();
    return;
  }

  if (devCounts.leads === 0 && devCounts.clients === 0) {
    console.error("La base DEV no tiene datos ERP. Abortando.");
    process.exit(1);
  }

  console.log("\nVaciando tablas ERP en production (no toca sitio público)...");
  await prod.$executeRawUnsafe(
    `TRUNCATE TABLE ${ERP_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`
  );

  console.log("Copiando Lead...");
  const leads = await dev.lead.findMany();
  if (leads.length) await prod.lead.createMany({ data: leads });

  console.log("Copiando Quote...");
  const quotes = await dev.quote.findMany();
  if (quotes.length) await prod.quote.createMany({ data: quotes });

  console.log("Copiando Client...");
  const clients = await dev.client.findMany();
  if (clients.length) await prod.client.createMany({ data: clients });

  console.log("Copiando ClientProject...");
  const projects = await dev.clientProject.findMany();
  if (projects.length) await prod.clientProject.createMany({ data: projects });

  console.log("Copiando Invoice...");
  const invoices = await dev.invoice.findMany();
  if (invoices.length) await prod.invoice.createMany({ data: invoices });

  console.log("Copiando ClientAccessToken...");
  const tokens = await dev.clientAccessToken.findMany();
  if (tokens.length) await prod.clientAccessToken.createMany({ data: tokens });

  console.log("Copiando ContractAcceptance...");
  const contracts = await dev.contractAcceptance.findMany();
  if (contracts.length) await prod.contractAcceptance.createMany({ data: contracts });

  if (includeGallery) {
    console.log("Copiando PortfolioGalleryItem...");
    const gallery = await dev.portfolioGalleryItem.findMany();
    if (gallery.length) {
      await prod.portfolioGalleryItem.deleteMany();
      await prod.portfolioGalleryItem.createMany({ data: gallery });
    }
  }

  const prodAfter = await counts(prod);
  console.log("\nConteos en PRODUCTION (después):", prodAfter);
  console.log("\nSitio público intacto:");
  console.log(`  SiteContent: ${prodCounts.siteContent} → ${prodAfter.siteContent}`);
  console.log(`  Project: ${prodCounts.portfolio} → ${prodAfter.portfolio}`);
  console.log(`  ContactMessage: ${prodCounts.contacts} → ${prodAfter.contacts}`);
  console.log("\nListo. Verificá /admin en sofiaciabattoni.com");

  await dev.$disconnect();
  await prod.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
