import type { HtmlPhaseKey } from "@/lib/phase-client-flow";

export type PhaseClientStatus = "borrador" | "enviado" | "recibido";

export type PhaseClientMeta = {
  clientStatus: PhaseClientStatus;
  clientSentAt: string;
  clientReceivedAt: string;
};

type PhaseMap = Record<string, Record<string, string>>;

export function getPhaseClientMeta(
  phaseData: Record<string, string> | undefined,
): PhaseClientMeta {
  const d = phaseData ?? {};
  const status = (d.clientStatus as PhaseClientStatus) || "borrador";
  return {
    clientStatus: status,
    clientSentAt: d.clientSentAt ?? "",
    clientReceivedAt: d.clientReceivedAt ?? "",
  };
}

export function applyPhaseClientSent(
  phases: PhaseMap,
  storageKey: string,
): PhaseMap {
  const now = new Date().toISOString();
  const next = { ...phases };
  next[storageKey] = {
    ...(next[storageKey] ?? {}),
    state: "active",
    clientStatus: "enviado",
    clientSentAt: now,
    clientReceivedAt: "",
  };
  return next;
}

export function applyPhaseClientReceived(
  phases: PhaseMap,
  storageKey: string,
): PhaseMap {
  const now = new Date().toISOString();
  const next = { ...phases };
  next[storageKey] = {
    ...(next[storageKey] ?? {}),
    state: "done",
    clientStatus: "recibido",
    clientReceivedAt: now,
  };
  return next;
}

export function storageKeyForHtmlPhase(phase: HtmlPhaseKey): string {
  return phase;
}

export const PHASE_CLIENT_STATUS_LABELS: Record<PhaseClientStatus, string> = {
  borrador: "Sin enviar",
  enviado: "Enviado — esperando confirmación",
  recibido: "Recibido por el cliente",
};
