import type { Metadata } from "next";

export const SITE_NAME = "Soulful Branding®";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.sofiaciabattoni.com"
).replace(/\/$/, "");

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
