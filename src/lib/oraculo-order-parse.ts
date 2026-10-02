const RECEIPT_RE = /^Comprobante:\s*(.+)$/m;
const DELIVERY_SENT_RE = /^ENTREGA_ENVIADA:\s*(.+)$/m;
const CLIENT_LINK_RE = /^LINK_CLIENTE:\s*(.+)$/m;
const YOUTUBE_LINK_RE = /^YOUTUBE:\s*(.+)$/m;

export function parseOraculoReceiptUrl(message: string): string | null {
  const m = message.match(RECEIPT_RE);
  const url = m?.[1]?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export function parseOraculoDeliveryInfo(message: string): {
  sentAt: string | null;
  downloadLink: string | null;
  youtubeLink: string | null;
} {
  const sentAt = message.match(DELIVERY_SENT_RE)?.[1]?.trim() ?? null;
  const downloadLink = message.match(CLIENT_LINK_RE)?.[1]?.trim() ?? null;
  const youtubeLink = message.match(YOUTUBE_LINK_RE)?.[1]?.trim() ?? null;
  return { sentAt, downloadLink, youtubeLink };
}

export function stripOraculoDeliveryRecord(message: string): string {
  const idx = message.indexOf("\n\n---\nENTREGA_ENVIADA:");
  if (idx === -1) return message;
  return message.slice(0, idx).trimEnd();
}

export function appendOraculoDeliveryRecord(
  message: string,
  downloadLink: string,
  youtubeLink?: string | null,
): string {
  const base = stripOraculoDeliveryRecord(message);
  const stamp = new Date().toISOString();
  const yt = youtubeLink?.trim();
  const youtubeLine = yt ? `\nYOUTUBE: ${yt}` : "";
  return `${base}\n\n---\nENTREGA_ENVIADA: ${stamp}\nLINK_CLIENTE: ${downloadLink}${youtubeLine}`;
}

export function isOraculoOrderMessage(formKey: string, message: string): boolean {
  return formKey === "oraculo-raiz" || message.trimStart().startsWith("Pedido Oráculo Raíz");
}
