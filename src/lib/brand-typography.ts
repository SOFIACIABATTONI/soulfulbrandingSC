/**
 * Tipografía única Soulful Branding® — manual: Helvetica (cuerpo) + Garamond (titulares).
 * Usar estos tokens en portales cliente, mails y HTML/PDF del circuito Sofía ↔ cliente.
 */

/** Cuerpo — Helvetica con fallback Arial (sin Segoe/Roboto). */
export const brandSansFamily =
  '"Helvetica Neue", Helvetica, Arial, sans-serif';

/** Titulares en web (Next carga EB Garamond en `--font-garamond`). */
export const brandSerifFamily =
  'var(--font-garamond), "EB Garamond", "Apple Garamond", Georgia, serif';

/** Titulares en correos e HTML embebido (sin variables CSS). */
export const brandSerifFamilyEmail =
  '"EB Garamond", "Apple Garamond", Georgia, serif';

/** Valores listos para `font-family:` inline en mails. */
export const brandSansStack = brandSansFamily;
export const brandSerifStack = brandSerifFamily;
export const brandSerifStackEmail = brandSerifFamilyEmail;

/** Google Fonts — misma familia que `next/font` EB Garamond en el sitio. */
export const brandEmailGaramondStylesheet =
  "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap";

export function brandEmailTypographyHead(): string {
  return `<link href="${brandEmailGaramondStylesheet}" rel="stylesheet"/>
<style type="text/css">
  .brand-email-body, .brand-email-body td, .brand-email-body p, .brand-email-body li, .brand-email-body a {
    font-family: ${brandSansFamily} !important;
  }
  .brand-email-serif {
    font-family: ${brandSerifFamilyEmail} !important;
  }
</style>`;
}

/** Bloque CSS reutilizable en HTML de descarga / impresión (identidad, fases). */
export const phaseDocTypographyCss = `
body, .phase-doc-html, .phase-doc-html p, .phase-doc-html li, .phase-doc-html td, .phase-doc-html th, .doc-header p {
  font-family: ${brandSansFamily};
}
.doc-header h1, .phase-doc-html h1, .phase-doc-html h2, .phase-doc-html h3, .brand-kit h2, .brand-kit h3 {
  font-family: ${brandSerifFamilyEmail};
  font-style: italic;
  font-weight: 400;
}
`.trim();
