import { resolveSiteUrl } from "@/lib/site-metadata";

export function quotePublicUrl(token: string): string {
  return `${resolveSiteUrl()}/presupuesto/${encodeURIComponent(token)}`;
}
