import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import { getOraculoPageLayout } from "@/lib/oraculo-page-layout";
import { ORACULO_MEDIA, getOraculoPresentationVideoUrl } from "@/lib/oraculo-content";

export type OraculoMediaUrls = {
  bienvenidaAudio: string;
  salpicadoCartas: string;
  footerImage: string;
  florNegra: string;
  flagAr: string;
  flagEs: string;
};

export type OraculoPageContentData = {
  version: 1;
  /** URL pública del video de presentación (mp4/mov). Vacío = usar env o dev local. */
  presentationVideoUrl: string;
  media: OraculoMediaUrls;
  blocks: OraculoBlock[];
};

export function defaultOraculoMedia(): OraculoMediaUrls {
  return { ...ORACULO_MEDIA };
}

export function buildDefaultOraculoPageContent(paymentLink?: string): OraculoPageContentData {
  return {
    version: 1,
    presentationVideoUrl: "",
    media: defaultOraculoMedia(),
    blocks: getOraculoPageLayout(paymentLink),
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
