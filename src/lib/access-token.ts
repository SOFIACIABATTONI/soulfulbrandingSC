import { randomBytes } from "crypto";
import type { AccessPurpose } from "@/lib/contract-types";
import { ACCESS_EXPIRY_DAYS } from "@/lib/contract-types";

/** Token público de portal cliente (se guarda en texto plano en ClientAccessToken). */
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function accessExpiryFromNow(days = ACCESS_EXPIRY_DAYS): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const PERMANENT_ACCESS_PURPOSES = new Set<AccessPurpose>(["identidad", "manual"]);

export function isPermanentAccessPurpose(purpose: string): boolean {
  return PERMANENT_ACCESS_PURPOSES.has(purpose as AccessPurpose);
}

/** Identidad y manual: enlace sin vencimiento para que el cliente conserve su marca. */
export function accessExpiryForPurpose(purpose: string): Date {
  if (isPermanentAccessPurpose(purpose)) {
    return new Date("2099-12-31T23:59:59.999Z");
  }
  return accessExpiryFromNow();
}
