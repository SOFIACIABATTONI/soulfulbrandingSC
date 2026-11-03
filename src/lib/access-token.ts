import { randomBytes } from "crypto";
import type { AccessPurpose } from "@/lib/contract-types";

/** Fecha lejana: los enlaces del cliente no vencen. */
const CLIENT_LINK_NEVER_EXPIRES = new Date("2099-12-31T23:59:59.999Z");

/** Token público de portal cliente (se guarda en texto plano en ClientAccessToken). */
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Los enlaces del cliente no caducan. El argumento se conserva por compatibilidad. */
export function accessExpiryFromNow(_days?: number): Date {
  return new Date(CLIENT_LINK_NEVER_EXPIRES);
}

/** Identidad, manual, etapas, contrato, pre-brief, narrativa: el cliente conserva el enlace. */
export function isPermanentAccessPurpose(_purpose?: string): boolean {
  return true;
}

export function accessExpiryForPurpose(_purpose?: string): Date {
  return new Date(CLIENT_LINK_NEVER_EXPIRES);
}

export type { AccessPurpose };
