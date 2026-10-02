/** Archivos y YouTube del mail de entrega Oráculo Raíz (variables en Vercel). */

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const FETCH_TIMEOUT_MS = 45_000;

export function getOraculoDeliveryYoutubeUrl(): string | null {
  const raw =
    process.env.ORACULO_DELIVERY_YOUTUBE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ORACULO_DELIVERY_YOUTUBE_URL?.trim();
  return raw && /^https?:\/\//i.test(raw) ? raw : null;
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

/** Descarga los PDFs/archivos configurados para adjuntar al mail del cliente. */
export async function loadOraculoDeliveryFileAttachments(): Promise<OraculoEmailFileAttachment[]> {
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
