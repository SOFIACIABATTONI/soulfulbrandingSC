type Bucket = { count: number; resetAt: number };

const namespaces = new Map<string, Map<string, Bucket>>();

function getNamespace(namespace: string): Map<string, Bucket> {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new Map();
    namespaces.set(namespace, store);
  }
  return store;
}

/** Rate limit en memoria (por instancia serverless). Devuelve false si se excedió la cuota. */
export function checkRateLimit(
  namespace: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const store = getNamespace(namespace);
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

export function requestClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
