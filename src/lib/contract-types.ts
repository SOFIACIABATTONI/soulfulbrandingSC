import { z } from "zod";

export const CONTRACT_STATUSES = ["borrador", "enviado", "aceptado"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aceptado: "Aceptado",
};

export const ACCESS_PURPOSES = [
  "pre-brief",
  "contrato",
  "narrativa",
  "deep-dive",
  "identidad",
  "manual",
  "entrega",
] as const;
export type AccessPurpose = (typeof ACCESS_PURPOSES)[number];

export const ACCESS_EXPIRY_DAYS = 7;

export const contractContentSchema = z.object({
  body: z.string(),
  format: z.enum(["markdown", "plain", "html"]).optional(),
});

export type ContractContent = z.infer<typeof contractContentSchema>;

export function normalizeContractContent(raw: unknown): ContractContent {
  const parsed = contractContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (raw && typeof raw === "object" && "body" in raw && typeof (raw as { body: unknown }).body === "string") {
    return { body: (raw as { body: string }).body, format: "markdown" };
  }
  return { body: "", format: "markdown" };
}
