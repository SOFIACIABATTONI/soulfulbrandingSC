import type { Metadata } from "next";

export const SITE_NAME = "Soulful Branding®";

const DEFAULT_SITE_URL = "https://www.sofiaciabattoni.com";

/**
 * URL base para metadata, Open Graph y enlaces absolutos.
 * - Preview Vercel: host del deployment (og:image apunta al mismo build desplegado).
 * - Producción: dominio canónico (`NEXT_PUBLIC_SITE_URL`).
 * - Local: `NEXT_PUBLIC_SITE_URL` o localhost.
 */
export function resolveSiteUrl(): string {
  const canonical = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "preview" && vercelHost) {
    return `https://${vercelHost}`;
  }

  if (vercelEnv === "production" && canonical) {
    return canonical;
  }

  if (canonical) return canonical;

  if (vercelHost) return `https://${vercelHost}`;

  return process.env.NODE_ENV === "production"
    ? DEFAULT_SITE_URL
    : "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const DEFAULT_DESCRIPTION =
  "Estudio de branding estratégico e identidad de marca. Método Soulful Branding® — estrategia, energía e identidad para marcas conscientes.";

/** Imagen por defecto para compartir en redes (ruta bajo `public/`) */
export const DEFAULT_OG_IMAGE_PATH = "/media/og-sofia-creative-process-floor.jpg";

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  /** Ruta del sitio, p. ej. `/about` */
  path?: string;
  /** Ruta bajo `public/` para `og:image` */
  imagePath?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  imagePath = DEFAULT_OG_IMAGE_PATH,
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: "es_AR",
      type: "website",
      images: [
        {
          url: imagePath,
          alt: `${title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imagePath],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
