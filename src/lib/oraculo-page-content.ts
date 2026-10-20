import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import { getOraculoPageLayout } from "@/lib/oraculo-page-layout";
import { ORACULO_MEDIA, ORACULO_PAYMENT, getOraculoPresentationVideoUrl } from "@/lib/oraculo-content";

export type OraculoMediaUrls = {
  bienvenidaAudio: string;
  salpicadoCartas: string;
  footerImage: string;
  florNegra: string;
  flagAr: string;
  flagEs: string;
};

export type OraculoPaymentSettings = {
  ar: {
    label: string;
    price: string;
    alias: string;
    cvu: string;
    cvuLabel: string;
  };
  es: {
    label: string;
    price: string;
    phone: string;
    /** Link transferencia España (Stripe, etc.) */
    paymentLink: string;
  };
};

export type OraculoPageContentData = {
  version: 1;
  /** URL pública del video de presentación (mp4/mov). Vacío = usar env o dev local. */
  presentationVideoUrl: string;
  media: OraculoMediaUrls;
  payment: OraculoPaymentSettings;
  blocks: OraculoBlock[];
};

export function defaultOraculoMedia(): OraculoMediaUrls {
  return { ...ORACULO_MEDIA };
}

export function defaultOraculoPayment(envPaymentLink?: string): OraculoPaymentSettings {
  const link =
    envPaymentLink?.trim() ||
    process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() ||
    ORACULO_PAYMENT.es.paymentLink ||
    "";
  return {
    ar: {
      label: ORACULO_PAYMENT.ar.label,
      price: ORACULO_PAYMENT.ar.price,
      alias: ORACULO_PAYMENT.ar.alias,
      cvu: ORACULO_PAYMENT.ar.cvu,
      cvuLabel: ORACULO_PAYMENT.ar.cvuLabel,
    },
    es: {
      label: ORACULO_PAYMENT.es.label,
      price: ORACULO_PAYMENT.es.price,
      phone: ORACULO_PAYMENT.es.phone,
      paymentLink: link,
    },
  };
}

export function parseOraculoPayment(raw: unknown, envPaymentLink?: string): OraculoPaymentSettings {
  const d = defaultOraculoPayment(envPaymentLink);
  if (!isRecord(raw)) return d;
  const ar = isRecord(raw.ar) ? raw.ar : {};
  const es = isRecord(raw.es) ? raw.es : {};
  return {
    ar: {
      label: asString(ar.label, d.ar.label),
      price: asString(ar.price, d.ar.price),
      alias: asString(ar.alias, d.ar.alias),
      cvu: asString(ar.cvu, d.ar.cvu),
      cvuLabel: asString(ar.cvuLabel, d.ar.cvuLabel),
    },
    es: {
      label: asString(es.label, d.es.label),
      price: asString(es.price, d.es.price),
      phone: asString(es.phone, d.es.phone),
      paymentLink: asString(es.paymentLink, d.es.paymentLink),
    },
  };
}

export function buildDefaultOraculoPageContent(paymentLink?: string): OraculoPageContentData {
  const payment = defaultOraculoPayment(paymentLink);
  return {
    version: 1,
    presentationVideoUrl: "",
    media: defaultOraculoMedia(),
    payment,
    blocks: getOraculoPageLayout(payment.es.paymentLink),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function parseMedia(raw: unknown): OraculoMediaUrls {
  const d = defaultOraculoMedia();
  if (!isRecord(raw)) return d;
  return {
    bienvenidaAudio: asString(raw.bienvenidaAudio, d.bienvenidaAudio),
    salpicadoCartas: asString(raw.salpicadoCartas, d.salpicadoCartas),
    footerImage: asString(raw.footerImage, d.footerImage),
    florNegra: asString(raw.florNegra, d.florNegra),
    flagAr: asString(raw.flagAr, d.flagAr),
    flagEs: asString(raw.flagEs, d.flagEs),
  };
}

function parseBlock(raw: unknown): OraculoBlock | null {
  if (!isRecord(raw) || typeof raw.kind !== "string") return null;
  const kind = raw.kind;
  switch (kind) {
    case "title":
      return { kind: "title", text: asString(raw.text) };
    case "sub_header":
      return {
        kind: "sub_header",
        lines: Array.isArray(raw.lines) ? raw.lines.map((l) => asString(l)) : [],
      };
    case "sub_sub_header":
      return {
        kind: "sub_sub_header",
        lines: Array.isArray(raw.lines) ? raw.lines.map((l) => asString(l)) : [],
        boldFromLine: typeof raw.boldFromLine === "number" ? raw.boldFromLine : undefined,
        align: raw.align === "center" ? "center" : undefined,
      };
    case "text":
      return {
        kind: "text",
        html: asString(raw.html),
        align: raw.align === "center" ? "center" : undefined,
        size: raw.size === "sm" ? "sm" : undefined,
        variant: raw.variant === "brandLines" ? "brandLines" : undefined,
      };
    case "bulleted_list":
      return {
        kind: "bulleted_list",
        text: asString(raw.text),
        size: raw.size === "sm" ? "sm" : undefined,
      };
    case "image":
      return {
        kind: "image",
        src: asString(raw.src),
        alt: raw.alt != null ? asString(raw.alt) : undefined,
        href: raw.href != null ? asString(raw.href) : undefined,
        scale: raw.scale === "compact" ? "compact" : undefined,
      };
    case "callout_image":
      return { kind: "callout_image", src: asString(raw.src) };
    case "video":
      return { kind: "video", caption: asString(raw.caption) };
    case "audio":
      return { kind: "audio" };
    case "payment_card":
      return { kind: "payment_card" };
    case "form":
      return { kind: "form" };
    case "spacer":
      return { kind: "spacer", size: raw.size === "lg" ? "lg" : undefined };
    default:
      return null;
  }
}

export function parseOraculoPageContent(raw: unknown, paymentLink?: string): OraculoPageContentData {
  const fallback = buildDefaultOraculoPageContent(paymentLink);
  if (!isRecord(raw)) return fallback;

  const blocksRaw = Array.isArray(raw.blocks) ? raw.blocks : [];
  const blocks: OraculoBlock[] = [];
  for (const item of blocksRaw) {
    const b = parseBlock(item);
    if (b) blocks.push(b);
  }

  return {
    version: 1,
    presentationVideoUrl: asString(raw.presentationVideoUrl),
    media: parseMedia(raw.media),
    payment: parseOraculoPayment(raw.payment, paymentLink),
    blocks: blocks.length > 0 ? blocks : fallback.blocks,
  };
}

/** Reemplaza la línea de transferencia España según el link de pago actual. */
export function applyOraculoPaymentLinkToBlocks(
  blocks: OraculoBlock[],
  paymentLink: string,
): OraculoBlock[] {
  return blocks.map((b) => {
    if (b.kind !== "text" || !b.html.includes("Transferencia")) return b;
    return {
      ...b,
      html: paymentLink
        ? `<strong>Transferencia</strong>: <a href="${paymentLink}" class="underline" target="_blank" rel="noopener noreferrer">link de pago</a>`
        : "<strong>Transferencia</strong>: link de pago",
    };
  });
}

export function resolveOraculoPresentationVideoUrlFromContent(
  content: OraculoPageContentData,
): string {
  const fromDb = content.presentationVideoUrl.trim();
  if (/^https?:\/\//i.test(fromDb)) return fromDb;
  if (fromDb.startsWith("/")) return fromDb;
  return getOraculoPresentationVideoUrl();
}
