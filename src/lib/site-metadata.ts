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

/** Imagen por defecto para compartir en redes (1200×630, <300 KB — requisito WhatsApp) */
export const DEFAULT_OG_IMAGE_PATH = "/media/og-sofia-share.jpg";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

type BuildPageMetadataInput = {
  /** Título para Google / pestaña del navegador */
  title: string;
  /** Meta description para Google */
  description?: string;
  /** og:title — si no se pasa, usa `title` */
  openGraphTitle?: string;
  /** og:description — si no se pasa, usa `description` */
  openGraphDescription?: string;
  /** Ruta del sitio, p. ej. `/about` */
  path?: string;
  /** Ruta bajo `public/` para `og:image` */
  imagePath?: string;
  /** Ancho og:image (opcional; por defecto en imagen share) */
  imageWidth?: number;
  /** Alto og:image (opcional; por defecto en imagen share) */
  imageHeight?: number;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  openGraphTitle,
  openGraphDescription,
  path = "/",
  imagePath = DEFAULT_OG_IMAGE_PATH,
  imageWidth,
  imageHeight,
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const ogTitle = openGraphTitle ?? title;
  const ogDescription = openGraphDescription ?? description;
  const ogW =
    imageWidth ??
    (imagePath === DEFAULT_OG_IMAGE_PATH ? DEFAULT_OG_IMAGE_WIDTH : undefined);
  const ogH =
    imageHeight ??
    (imagePath === DEFAULT_OG_IMAGE_PATH ? DEFAULT_OG_IMAGE_HEIGHT : undefined);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: "es_AR",
      type: "website",
      images: [
        {
          url: imagePath,
          alt: `${ogTitle} — ${SITE_NAME}`,
          ...(ogW && ogH ? { width: ogW, height: ogH } : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [imagePath],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
