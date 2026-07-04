import { resolveSiteUrl } from "@/lib/site-metadata";
import type { AccessPurpose } from "@/lib/contract-types";

export function accessPublicUrl(purpose: AccessPurpose, token: string): string {
  const base = resolveSiteUrl();
  return `${base}/cliente/${purpose}?token=${encodeURIComponent(token)}`;
}
