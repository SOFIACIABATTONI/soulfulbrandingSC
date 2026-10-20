import { prisma } from "@/lib/prisma";
import {
  applyOraculoPaymentLinkToBlocks,
  buildDefaultOraculoPageContent,
  parseOraculoPageContent,
  resolveOraculoPresentationVideoUrlFromContent,
  defaultOraculoPayment,
  type OraculoMediaUrls,
  type OraculoPageContentData,
  type OraculoPaymentSettings,
} from "@/lib/oraculo-page-content";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";

export type OraculoPublicPageData = {
  blocks: OraculoBlock[];
  videoUrl: string;
  media: OraculoMediaUrls;
  payment: OraculoPaymentSettings;
  /** true si hay fila guardada en BD con bloques */
  fromDatabase: boolean;
};

export async function getOraculoPaymentForOrder(): Promise<OraculoPaymentSettings> {
  const envLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  const stored = await getOraculoPageContentRow();
  if (stored) return stored.payment;
  return defaultOraculoPayment(envLink);
}

function isMissingOraculoTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

/** false si la tabla OraculoPageContent no existe (migración pendiente). */
export async function isOraculoContentPersistenceReady(): Promise<boolean> {
  try {
    await prisma.oraculoPageContent.findFirst({ select: { id: true } });
    return true;
  } catch (error) {
    if (isMissingOraculoTable(error)) return false;
    console.warn("[oraculo-content] persistence check failed", error);
    return false;
  }
}

export async function getOraculoPageContentRow(): Promise<OraculoPageContentData | null> {
  try {
    const row = await prisma.oraculoPageContent.findUnique({ where: { id: 1 } });
    if (!row?.data) return null;
    const envLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
    return parseOraculoPageContent(row.data, envLink);
  } catch (error) {
    console.warn("[oraculo-content] DB read failed", error);
    return null;
  }
}

export async function saveOraculoPageContent(data: OraculoPageContentData): Promise<void> {
  const envLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  const parsed = parseOraculoPageContent(data, envLink);
  await prisma.oraculoPageContent.upsert({
    where: { id: 1 },
    create: { id: 1, data: parsed as object },
    update: { data: parsed as object },
  });
}

export async function getOraculoPublicPageData(envPaymentLink?: string): Promise<OraculoPublicPageData> {
  const envLink = envPaymentLink?.trim() || process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";
  const stored = await getOraculoPageContentRow();
  if (stored && stored.blocks.length > 0) {
    const payment = stored.payment;
    const esLink = payment.es.paymentLink.trim() || envLink;
    return {
      blocks: applyOraculoPaymentLinkToBlocks(stored.blocks, esLink),
      videoUrl: resolveOraculoPresentationVideoUrlFromContent(stored),
      media: stored.media,
      payment: {
        ...payment,
        es: { ...payment.es, paymentLink: esLink },
      },
      fromDatabase: true,
    };
  }

  const defaults = buildDefaultOraculoPageContent(envLink);
  const esLink = defaults.payment.es.paymentLink.trim() || envLink;
  return {
    blocks: applyOraculoPaymentLinkToBlocks(defaults.blocks, esLink),
    videoUrl: resolveOraculoPresentationVideoUrlFromContent(defaults),
    media: defaults.media,
    payment: defaults.payment,
    fromDatabase: false,
  };
}
