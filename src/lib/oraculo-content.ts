/** Textos y datos de la landing Oráculo Raíz (réplica del Notion original). */

/**
 * Local: `/api/oraculo/presentation-video` (archivo en `assets/oraculo/`, ~560 MB .mov).
 * Preview/Production: URL pública en R2 vía `scripts/upload-oraculo-video.ts` +
 * `NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL` (preferir .mp4 para Chrome).
 */
export function getOraculoPresentationVideoUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
    process.env.ORACULO_PRESENTATION_VIDEO_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "/api/oraculo/presentation-video";
  }
  return "";
}

export const ORACULO_MEDIA = {
  bienvenidaAudio: "/oraculo/bienvenida.m4a",
  salpicadoCartas: "/oraculo/salpicado-cartas.gif",
  footerImage: "/oraculo/footer-sc.png",
  florNegra: "/oraculo/so-flor-negra.png",
  flagAr: "/oraculo/notion-export/img-18.gif",
  flagEs: "/oraculo/notion-export/img-22.gif",
} as const;

export const ORACULO_PAYMENT = {
  ar: {
    label: "ARGENTINA",
    price: "$44.000",
    alias: "sofia.ciabattoni",
    cvu: "0000003100025235499782",
    cvuLabel: "Cvu Mercado Pago",
  },
  es: {
    label: "ESPAÑA",
    price: "€44",
    phone: "+34 611 916 158",
    paymentLink: process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "",
  },
} as const;

export const ORACULO_EDITION_INCLUDES = [
  "23 cartas imprimibles en PDF (Formato A3 · blanco y negro · listas para intervenir).",
  "Instructivo de materialización paso a paso",
  "PDF con profundización y exploración del mensaje",
  "Grabación de profundización con Arcanos Mayores del Tarot",
] as const;

export const ORACULO_TAROT_NOTE =
  "(*) Las 23 cartas no son un número al azar. Son un espejo de los 23 arcanos mayores del Tarot, El Viaje del Loco —el mapa simbólico completo del viaje interior.";
