import { resolveSiteUrl } from "@/lib/site-metadata";
import type { AccessPurpose } from "@/lib/contract-types";
import { isGenericPhasePortalPurpose } from "@/lib/project-phase-layout";

export function accessPublicUrl(purpose: string, token: string): string {
  const base = resolveSiteUrl();
  if (isGenericPhasePortalPurpose(purpose)) {
    return `${base}/cliente/fase?token=${encodeURIComponent(token)}`;
  }
  return `${base}/cliente/${purpose as AccessPurpose}?token=${encodeURIComponent(token)}`;
}
