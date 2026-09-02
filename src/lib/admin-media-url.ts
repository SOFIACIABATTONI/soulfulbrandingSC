/** Rutas `/uploads/…` solo existen en dev local (gitignored); en Vercel siempre 404. */
export function isLegacyLocalUploadPath(url: string): boolean {
  const u = url.trim();
  return u.startsWith("/uploads/") || (!u.includes("://") && !u.startsWith("/api/") && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(u));
}

export function isDevAdminMediaUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith("/api/admin/dev-upload/") || u.startsWith("/api/public/dev-media/");
}

/** Valida que la API devolvió una URL pública usable (Blob https o dev-upload). */
export function assertPublicUploadUrl(url: string, context = "la subida"): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error(`No se recibió URL tras ${context}.`);
  }
  if (isLegacyLocalUploadPath(trimmed)) {
    throw new Error(
      "La subida devolvió una ruta inválida. En Vercel conectá Blob al proyecto (Storage → Preview + Production) y volvé a subir.",
    );
  }
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    isDevAdminMediaUrl(trimmed)
  ) {
    return trimmed;
  }
  throw new Error(`URL inválida tras ${context}. Probá de nuevo o contactá soporte.`);
}

/** Escapa una URL para usarla dentro de `url("…")` en CSS. */
export function cssBackgroundUrl(url: string): string {
  const safe = url.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${safe}")`;
}
