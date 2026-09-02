/** Textos y datos de la landing Oráculo Raíz (réplica del Notion original). */

export const ORACULO_MEDIA = {
  bienvenidaAudio: "/oraculo/bienvenida.m4a",
  salpicadoCartas: "/oraculo/salpicado-cartas.gif",
  footerImage: "/oraculo/footer-sc.png",
  /** Definir en Vercel tras subir el .mov a Blob (`scripts/upload-oraculo-video.ts`). */
  presentationVideo:
    process.env.NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
    process.env.ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
    "",
} as const;

export const ORACULO_PAYMENT = {
  ar: {
    label: "ARGENTINA",
    price: "$44.000",
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
