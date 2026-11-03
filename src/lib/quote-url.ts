import { resolveClientFacingSiteUrl } from "@/lib/site-metadata";

export function quotePublicUrl(token: string): string {
  return `${resolveClientFacingSiteUrl()}/presupuesto/${encodeURIComponent(token)}`;
}
