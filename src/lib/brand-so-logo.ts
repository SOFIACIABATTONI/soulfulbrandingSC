import { resolveSiteUrl } from "@/lib/site-metadata";

/** Logo SÓ (SC_so_logo) en fucsia — ruta pública servida por Next. */
export const SO_LOGO_FUCHSIA_PATH = "/brand/sc-so-logo-fuchsia.png";
/** Content-ID compartido para incrustar el logo en todos los correos. */
export const SO_LOGO_EMAIL_CID = "so-logo-fuchsia";

/** Base URL para assets en mails (en local usa dominio de producción para que cargue el logo). */
function resolveEmailAssetBaseUrl(): string {
  const site = resolveSiteUrl().replace(/\/$/, "");
  if (/localhost|127\.0\.0\.1/i.test(site)) return "https://www.sofiaciabattoni.com";
  return site;
}

export function soLogoFuchsiaUrl(baseUrl?: string): string {
  const base = (baseUrl ?? resolveEmailAssetBaseUrl()).replace(/\/$/, "");
  return `${base}${SO_LOGO_FUCHSIA_PATH}`;
}
