import { checkRateLimit, requestClientIp } from "@/lib/rate-limit";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function checkPublicQuoteRateLimit(key: string): boolean {
  return checkRateLimit("public-quote", key, MAX_PER_WINDOW, WINDOW_MS);
}

export function clientRateLimitKey(req: Request, token: string): string {
  return `${requestClientIp(req)}:${token.slice(0, 12)}`;
}
