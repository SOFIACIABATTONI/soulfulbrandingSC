import { resolveSiteUrl } from "@/lib/site-metadata";

/** URL pública para descargar el PDF del recibo / factura con token de un solo uso enviado por mail. */
export function invoicePublicPdfUrl(token: string): string {
  const base = resolveSiteUrl().replace(/\/$/, "");
  return `${base}/api/public/invoice/${encodeURIComponent(token)}/pdf`;
}
