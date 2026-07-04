import { randomBytes } from "crypto";

/** Token público de portal cliente (se guarda en texto plano en ClientAccessToken). */
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function accessExpiryFromNow(days = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
