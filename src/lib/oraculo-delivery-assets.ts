/** Archivos y YouTube del mail de entrega Oráculo Raíz (variables en Vercel). */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const FETCH_TIMEOUT_MS = 45_000;

const YOUTUBE_FILE = path.join(process.cwd(), "assets", "oraculo", "descargables", "linkYoutube.txt");
const DESCARGABLES_DIR = path.join(process.cwd(), "assets", "oraculo", "descargables");

export function getOraculoDefaultDownloadLink(): string | null {
  const raw =
    process.env.ORACULO_DEFAULT_DOWNLOAD_URL?.trim() ||
    process.env.NEXT_PUBLIC_ORACULO_DOWNLOAD_URL?.trim();
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
}

export function getOraculoDeliveryYoutubeUrl(): string | null {
  const raw =
    process.env.ORACULO_DELIVERY_YOUTUBE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ORACULO_DELIVERY_YOUTUBE_URL?.trim();
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
}

/** Env → archivo `assets/oraculo/descargables/linkYoutube.txt`. */
export async function resolveOraculoDeliveryYoutubeUrl(): Promise<string | null> {
  const fromEnv = getOraculoDeliveryYoutubeUrl();
  if (fromEnv) return fromEnv;
  try {
    const raw = await readFile(YOUTUBE_FILE, "utf8");
    const url = raw.trim();
    if (/^https?:\/\//i.test(url)) return url;
  } catch {
    /* sin archivo local */
  }
  return null;
}

/** URLs públicas (R2, etc.) separadas por coma o salto de línea. */
export function getOraculoDeliveryAttachmentUrls(): string[] {
  const raw = process.env.ORACULO_DELIVERY_ATTACHMENT_URLS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .slice(0, MAX_ATTACHMENTS);
}

function filenameFromUrl(url: string, index: number): string {
  try {
    const base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100);
    if (safe) return safe;
  } catch {
    /* ignore */
  }
  return `oraculo-material-${index + 1}.bin`;
}

export type OraculoEmailFileAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

async function loadLocalDescargablePdfs(): Promise<OraculoEmailFileAttachment[]> {
  if (process.env.VERCEL === "1") return [];
  try {
    const names = await readdir(DESCARGABLES_DIR);
    const pdfs = names.filter((n) => n.toLowerCase().endsWith(".pdf")).sort();
    const out: OraculoEmailFileAttachment[] = [];
    for (const name of pdfs) {
      if (out.length >= MAX_ATTACHMENTS) break;
      const buf = await readFile(path.join(DESCARGABLES_DIR, name));
      if (buf.length === 0 || buf.length > MAX_ATTACHMENT_BYTES) continue;
      out.push({
        filename: name.replace(/[^a-zA-Z0-9._-]+/g, "_"),
        content: buf,
        contentType: "application/pdf",
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function loadAttachmentsFromUrls(): Promise<OraculoEmailFileAttachment[]> {
  const urls = getOraculoDeliveryAttachmentUrls();
  const out: OraculoEmailFileAttachment[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) {
        console.warn(`[oraculo-delivery] attachment skip ${url}: HTTP ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > MAX_ATTACHMENT_BYTES) {
        console.warn(`[oraculo-delivery] attachment skip ${url}: size ${buf.length}`);
        continue;
      }
      const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
      out.push({
        filename: filenameFromUrl(url, i),
        content: buf,
        contentType,
      });
    } catch (e) {
      console.warn(`[oraculo-delivery] attachment fetch failed ${url}`, e);
    }
  }

  return out;
}

/** Descarga los PDFs configurados (URLs) o, en local, `assets/oraculo/descargables/*.pdf`. */
export async function loadOraculoDeliveryFileAttachments(): Promise<OraculoEmailFileAttachment[]> {
  const fromUrls = await loadAttachmentsFromUrls();
  if (fromUrls.length > 0) return fromUrls;
  return loadLocalDescargablePdfs();
}

export async function getOraculoDeliveryAttachmentCount(): Promise<number> {
  const urls = getOraculoDeliveryAttachmentUrls();
  if (urls.length > 0) return urls.length;
  if (process.env.VERCEL === "1") return 0;
  try {
    const names = await readdir(DESCARGABLES_DIR);
    return names.filter((n) => n.toLowerCase().endsWith(".pdf")).length;
  } catch {
    return 0;
  }
}
