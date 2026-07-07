import type { HtmlPhaseKey } from "@/lib/phase-client-flow";

/** Texto breve que ve el cliente en identidad visual (no las notas internas del admin). */
export function getIdentidadClientIntroHtml(): string {
  return `<h1>Tu identidad visual</h1>
<p>Acá está tu Brand ID: logos, colores, tipografías y recursos listos para descargar.</p>
<p><em>Guardá este enlace — no vence y podés volver cuando quieras.</em></p>`;
}

/** Detecta la plantilla interna larga (tablas, checklist) que no debe mostrarse al cliente. */
export function isLegacyIdentidadDevTemplate(html: string): boolean {
  const t = html.trim();
  if (!t) return false;
  return (
    t.includes("Identidad visual — desarrollo") ||
    t.includes("Dirección creativa acordada") ||
    t.includes("Sistema visual") ||
    t.includes("[Completar]") ||
    (t.includes("Entregables") && t.includes("Figma"))
  );
}

export function resolveClientPortalHtmlBody(
  phaseKey: HtmlPhaseKey,
  adminBody: string,
  opts?: { hasBrandKit?: boolean },
): string {
  const trimmed = adminBody.trim();
  if (phaseKey === "identidad" && opts?.hasBrandKit) {
    if (!trimmed || trimmed === "<p></p>" || isLegacyIdentidadDevTemplate(trimmed)) {
      return getIdentidadClientIntroHtml();
    }
    return trimmed;
  }
  return trimmed;
}
