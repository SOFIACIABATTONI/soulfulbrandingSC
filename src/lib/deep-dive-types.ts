export const DEEP_DIVE_STATUSES = ["pendiente", "enviado", "realizado"] as const;

export type DeepDiveStatus = (typeof DEEP_DIVE_STATUSES)[number];

export const DEEP_DIVE_STATUS_LABELS: Record<DeepDiveStatus, string> = {
  pendiente: "Pendiente",
  enviado: "Agenda enviada",
  realizado: "Realizado",
};

export function normalizeDeepDiveStatus(value: string): DeepDiveStatus {
  return DEEP_DIVE_STATUSES.includes(value as DeepDiveStatus)
    ? (value as DeepDiveStatus)
    : "pendiente";
}
