import JSZip from "jszip";
import {
  brandKitHasContent,
  buildPaletteColorsTxt,
  cardHasContent,
  deliverableCardFiles,
  isBrandKitPresentationGroup,
  isValidHex,
  normalizeHex,
  PALETTE_CARD_KEY,
  type BrandKit,
  type BrandKitCard,
} from "@/lib/brand-kit";
import { buildPhaseDocDownloadHtml } from "@/lib/phase-doc-download";

export type BrandKitZipEntry = {
  zipPath: string;
  url: string;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "brand-kit"
  );
}

export function brandKitZipFilename(portalTitle: string, projectTitle: string): string {
  return `${slugify(portalTitle)}-${slugify(projectTitle)}-soulful-branding.zip`;
}

export function resolveBrandAssetUrl(url: string, baseUrl: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    return `${baseUrl.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "archivo";
}

function uniqueZipPath(folder: string, fileName: string, used: Set<string>): string {
  const safe = sanitizeFileName(fileName);
  let candidate = folder ? `${folder}/${safe}` : safe;
  let n = 1;
  const ext = safe.includes(".") ? safe.slice(safe.lastIndexOf(".")) : "";
  const stem = ext ? safe.slice(0, -ext.length) : safe;
  while (used.has(candidate.toLowerCase())) {
    candidate = folder ? `${folder}/${stem}-${n}${ext}` : `${stem}-${n}${ext}`;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function collectBrandKitDownloadEntries(brandKit: BrandKit, baseUrl: string): BrandKitZipEntry[] {
  const entries: BrandKitZipEntry[] = [];
  const used = new Set<string>();

  for (const card of brandKit.cards) {
    if (!cardHasContent(card)) continue;
    const cardFolder = slugify(card.title);

    for (const group of card.fileGroups) {
      if (isBrandKitPresentationGroup(group.label)) continue;
      const groupFolder = slugify(group.label);
      for (const file of group.files) {
        const url = resolveBrandAssetUrl(file.url, baseUrl);
        if (!url) continue;
        const name = file.fileName.trim() || "archivo";
        entries.push({
          zipPath: uniqueZipPath(`${cardFolder}/${groupFolder}`, name, used),
          url,
        });
      }
    }
  }

  return entries;
}

export function buildBrandKitReadmeText(opts: {
  portalTitle: string;
  projectTitle: string;
  clientName: string;
  brandKit: BrandKit;
  skippedFiles: string[];
}): string {
  const lines: string[] = [
    `${opts.portalTitle} — ${opts.projectTitle}`,
    `Cliente: ${opts.clientName}`,
    "Soulful Branding® — Brand ID",
    "",
  ];

  for (const card of opts.brandKit.cards) {
    if (!cardHasContent(card)) continue;
    lines.push(card.title.toUpperCase(), "-".repeat(Math.min(card.title.length, 40)));

    if (card.driveUrl.trim()) lines.push(`Drive: ${card.driveUrl.trim()}`);
    if (card.sourceUrl.trim()) lines.push(`Fuente online: ${card.sourceUrl.trim()}`);

    if (card.colors.length > 0) {
      for (const c of card.colors) {
        lines.push(
          [
            c.name || "Color",
            normalizeHex(c.hex) || "—",
            c.rgb ? `RGB ${c.rgb}` : "",
            c.cmyk ? `CMYK ${c.cmyk}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        );
      }
    }

    for (const group of card.fileGroups) {
      if (isBrandKitPresentationGroup(group.label)) continue;
      const files = group.files.filter((f) => f.url.trim());
      if (files.length === 0) continue;
      lines.push(`${group.label}:`);
      for (const f of files) {
        lines.push(`  - ${f.fileName.trim() || "archivo"}`);
      }
    }

    if (card.notes.trim()) lines.push(`Notas: ${card.notes.trim()}`);
    lines.push("");
  }

  if (opts.skippedFiles.length > 0) {
    lines.push("ARCHIVOS NO INCLUIDOS", "--------------------");
    for (const name of opts.skippedFiles) lines.push(`- ${name}`);
    lines.push("");
  }

  lines.push("Generado desde tu portal Soulful Branding®.");
  return lines.join("\n");
}

async function fetchAssetBuffer(
  url: string,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; reason: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > MAX_FILE_BYTES) {
      return { ok: false, reason: "supera 20MB" };
    }
    return { ok: true, buffer };
  } catch {
    return { ok: false, reason: "no disponible" };
  }
}

export async function buildBrandKitZipBuffer(opts: {
  baseUrl: string;
  portalTitle: string;
  projectTitle: string;
  clientName: string;
  brandKit: BrandKit;
  htmlBody?: string;
}): Promise<{ buffer: Buffer; skippedFiles: string[] } | null> {
  if (!brandKitHasContent(opts.brandKit) && !opts.htmlBody?.trim()) return null;

  const zip = new JSZip();
  const skippedFiles: string[] = [];
  let totalBytes = 0;

  const entries = collectBrandKitDownloadEntries(opts.brandKit, opts.baseUrl);
  for (const entry of entries) {
    const fetched = await fetchAssetBuffer(entry.url);
    if (!fetched.ok) {
      skippedFiles.push(`${entry.zipPath} (${fetched.reason})`);
      continue;
    }
    if (totalBytes + fetched.buffer.length > MAX_TOTAL_BYTES) {
      skippedFiles.push(`${entry.zipPath} (límite total del paquete)`);
      continue;
    }
    totalBytes += fetched.buffer.length;
    zip.file(entry.zipPath, fetched.buffer);
  }

  if (brandKitHasContent(opts.brandKit)) {
    zip.file(
      "brand-id.txt",
      buildBrandKitReadmeText({
        portalTitle: opts.portalTitle,
        projectTitle: opts.projectTitle,
        clientName: opts.clientName,
        brandKit: opts.brandKit,
        skippedFiles,
      }),
    );

    const paletteCard = opts.brandKit.cards.find((c) => c.key === PALETTE_CARD_KEY);
    if (paletteCard?.colors.some((c) => isValidHex(c.hex))) {
      zip.file("paleta-colores/colores.txt", buildPaletteColorsTxt(paletteCard.colors));
    }
  }

  if (opts.htmlBody?.trim()) {
    zip.file(
      "documento.html",
      buildPhaseDocDownloadHtml({
        portalTitle: opts.portalTitle,
        projectTitle: opts.projectTitle,
        clientName: opts.clientName,
        htmlBody: opts.htmlBody,
        brandKit: opts.brandKit,
      }),
    );
  }

  const hasFiles = entries.some((e) => !skippedFiles.some((s) => s.startsWith(e.zipPath)));
  const hasReadme = brandKitHasContent(opts.brandKit);
  const hasDoc = Boolean(opts.htmlBody?.trim());
  if (!hasFiles && !hasReadme && !hasDoc) return null;

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return { buffer, skippedFiles };
}

export function brandKitHasDownloadableFiles(brandKit: BrandKit): boolean {
  return brandKit.cards.some((c) => deliverableCardFiles(c).length > 0);
}

export function countCardFiles(card: BrandKitCard): number {
  return deliverableCardFiles(card).length;
}
