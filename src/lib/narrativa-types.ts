import { z } from "zod";
import { contractContentSchema, normalizeContractContent } from "@/lib/contract-types";

export const NARRATIVA_STATUSES = ["borrador", "enviado", "recibido"] as const;
export type NarrativaStatus = (typeof NARRATIVA_STATUSES)[number];

export const NARRATIVA_STATUS_LABELS: Record<NarrativaStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado — esperando confirmación",
  recibido: "Recibido por el cliente",
};

export const narrativaContentSchema = contractContentSchema;
export type NarrativaContent = z.infer<typeof narrativaContentSchema>;

export function normalizeNarrativaContent(raw: unknown): NarrativaContent {
  return normalizeContractContent(raw);
}
