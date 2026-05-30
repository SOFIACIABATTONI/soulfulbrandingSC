import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Token público de alta entropía (solo se guarda el hash en DB). */
export function generateQuoteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashQuoteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokensMatch(plain: string, storedHash: string): boolean {
  const computed = hashQuoteToken(plain);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function tokenTail(token: string): string {
  if (token.length <= 8) return "****";
  return `…${token.slice(-6)}`;
}

/** Regenera token al enviar (invalida link anterior si existía). */
export function freshTokenForSend(): { plain: string; hash: string } {
  const plain = generateQuoteToken();
  return { plain, hash: hashQuoteToken(plain) };
}
