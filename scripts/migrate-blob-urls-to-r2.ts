/**
 * Migra URLs de Vercel Blob a Cloudflare R2 y actualiza Postgres.
 *
 * Requiere: DATABASE_URL + variables R2_* (ver docs/almacenamiento-r2.md)
 *
 *   npx tsx scripts/migrate-blob-urls-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-blob-urls-to-r2.ts
 */
import { PrismaClient } from "@prisma/client";
import { hasR2Configured, normalizeObjectKey, publicUrlForKey, putR2Object } from "../src/lib/object-storage";

const BLOB_HOST = "blob.vercel-storage.com";
const dryRun = process.argv.includes("--dry-run");

function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.hostname.includes(BLOB_HOST);
  } catch {
    return false;
  }
}

function blobPathnameToKey(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    return key ? normalizeObjectKey(key) : null;
  } catch {
    return null;
  }
}

const urlMap = new Map<string, string>();

async function migrateUrl(oldUrl: string): Promise<string> {
  const trimmed = oldUrl.trim();
  if (!isBlobUrl(trimmed)) return trimmed;
  const cached = urlMap.get(trimmed);
  if (cached) return cached;

  const key = blobPathnameToKey(trimmed);
  if (!key) {
    throw new Error(`No se pudo extraer key de: ${trimmed}`);
  }

  if (dryRun) {
    const next = publicUrlForKey(key);
    urlMap.set(trimmed, next);
    console.log(`[dry-run] ${trimmed} → ${next}`);
    return next;
  }

  const res = await fetch(trimmed);
  if (!res.ok) {
    throw new Error(`GET falló ${res.status} para ${trimmed}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const next = await putR2Object(key, buf, contentType);
  urlMap.set(trimmed, next);
  console.log(`✓ ${key} → ${next}`);
  return next;
}

function replaceInJsonString(json: string): { next: string; changed: boolean } {
  let changed = false;
  let next = json;
  for (const [from, to] of urlMap) {
    if (next.includes(from)) {
      next = next.split(from).join(to);
      changed = true;
    }
  }
  return { next, changed };
}

async function main() {
  if (!hasR2Configured()) {
    console.error("Configurá R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const blobUrls = new Set<string>();

  const projects = await prisma.clientProject.findMany({ select: { id: true, title: true, phases: true } });
  for (const p of projects) {
    const phases = p.phases as Record<string, Record<string, string>>;
    for (const phase of Object.values(phases)) {
      for (const value of Object.values(phase ?? {})) {
        if (typeof value !== "string") continue;
        if (value.includes(BLOB_HOST)) {
          const matches = value.match(/https?:\/\/[^\s"'\\)]+/g) ?? [];
          for (const m of matches) {
            if (isBlobUrl(m)) blobUrls.add(m);
          }
        }
      }
    }
  }

  const gallery = await prisma.portfolioGalleryItem.findMany({ select: { url: true } });
  for (const g of gallery) {
    if (isBlobUrl(g.url)) blobUrls.add(g.url.trim());
  }

  const portfolio = await prisma.project.findMany({ select: { imageUrl: true } });
  for (const row of portfolio) {
    if (isBlobUrl(row.imageUrl)) blobUrls.add(row.imageUrl.trim());
  }

  console.log(`URLs Blob únicas encontradas: ${blobUrls.size}`);
  if (blobUrls.size === 0) {
    await prisma.$disconnect();
    return;
  }

  for (const url of blobUrls) {
    await migrateUrl(url);
  }

  if (dryRun) {
    console.log("\nDry-run: no se escribió en la base de datos.");
    await prisma.$disconnect();
    return;
  }

  let updatedProjects = 0;
  for (const p of projects) {
    const raw = JSON.stringify(p.phases ?? {});
    const { next, changed } = replaceInJsonString(raw);
    if (changed) {
      await prisma.clientProject.update({
        where: { id: p.id },
        data: { phases: JSON.parse(next) },
      });
      updatedProjects += 1;
      console.log(`Actualizado proyecto ERP: ${p.title}`);
    }
  }

  for (const g of await prisma.portfolioGalleryItem.findMany()) {
    const next = urlMap.get(g.url.trim());
    if (next && next !== g.url) {
      await prisma.portfolioGalleryItem.update({ where: { id: g.id }, data: { url: next } });
    }
  }

  for (const row of await prisma.project.findMany()) {
    const next = urlMap.get(row.imageUrl.trim());
    if (next && next !== row.imageUrl) {
      await prisma.project.update({ where: { id: row.id }, data: { imageUrl: next } });
    }
  }

  console.log(`\nProyectos ERP actualizados: ${updatedProjects}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
