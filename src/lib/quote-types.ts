import { z } from "zod";

export const QUOTE_STATUSES = [
  "borrador",
  "enviado",
  "visto",
  "aprobado",
  "rechazado",
  "consultar",
  "expirado",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const CLIENT_RESPONSES = ["aprobado", "rechazado", "consultar"] as const;

export type ClientResponse = (typeof CLIENT_RESPONSES)[number];

export const QUOTE_CONTENT_FORMATS = ["markdown", "plain", "bbb-deck-2026"] as const;
export type QuoteContentFormat = (typeof QUOTE_CONTENT_FORMATS)[number];

export const quoteContentSchema = z.object({
  body: z.string().min(1).max(50000),
  format: z.enum(QUOTE_CONTENT_FORMATS).optional().default("markdown"),
  videoUrl: z.preprocess(
    (v) => (typeof v === "string" && !v.trim() ? undefined : v),
    z.string().url().max(500).optional(),
  ),
  total: z.number().positive().optional(),
  currency: z.string().max(8).optional(),
});

export type QuoteContent = z.infer<typeof quoteContentSchema>;

/** Acepta JSON guardado antes del campo video/format */
export function normalizeQuoteContent(raw: unknown): QuoteContent {
  if (!raw || typeof raw !== "object") {
    return { body: "", format: "markdown" };
  }
  const o = raw as Record<string, unknown>;
  const formatRaw = o.format;
  const format: QuoteContentFormat =
    formatRaw === "plain"
      ? "plain"
      : formatRaw === "bbb-deck-2026"
        ? "bbb-deck-2026"
        : "markdown";

  const parsed = quoteContentSchema.safeParse({
    body: typeof o.body === "string" ? o.body : "",
    format,
    videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : undefined,
    total: typeof o.total === "number" ? o.total : undefined,
    currency: typeof o.currency === "string" ? o.currency : undefined,
  });
  if (parsed.success) return parsed.data;
  return {
    body: typeof o.body === "string" ? o.body : "",
    format,
  };
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  visto: "Visto por cliente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  consultar: "Consulta / cambios",
  expirado: "Expirado",
};

export const CLIENT_RESPONSE_LABELS: Record<string, string> = {
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  consultar: "Quiero consultar cambios",
};

/** Días de validez del link desde el envío */
export const QUOTE_EXPIRY_DAYS = 30;
