import type { AccessPurpose } from "@/lib/contract-types";
import { isBuiltinProjectPhaseKey } from "@/lib/project-phase-catalog";
import {
  customPhaseAccessPurpose,
  customPhaseSendLabels,
  findCustomPhaseTitle,
  findPhaseDisplayTitle,
  genericBuiltinAccessPurpose,
  isBuiltinPhaseGenericMode,
  parseCustomPhaseKeyFromPurpose,
  parseGenericBuiltinPhaseKeyFromPurpose,
} from "@/lib/project-phase-layout";

/** Fases cuyo documento HTML (phases.*.body) se envía al cliente por mail. */
export type HtmlPhaseKey = "identidad" | "manual";

export type SendablePhaseKey = HtmlPhaseKey | `custom-${string}`;

export type PhaseSendConfig = {
  purpose: string;
  phaseKey: string;
  title: string;
  emailSubject: string;
  portalTitle: string;
  emailIntro: string;
  ackButton: string;
  ackSuccessTitle: string;
  ackSuccessBody: string;
  adminNotifySubject: string;
};

export const HTML_PHASE_SEND: Record<HtmlPhaseKey, PhaseSendConfig> = {
  identidad: {
    purpose: "identidad",
    phaseKey: "identidad",
    title: "Identidad visual",
    emailSubject: "Tu identidad visual — Soulful Branding®",
    portalTitle: "Identidad visual",
    emailIntro:
      "Tu **identidad visual** está lista para revisar. Revisá el documento y confirmá que lo recibiste.",
    ackButton: "Confirmar recibido",
    ackSuccessTitle: "Recibido confirmado",
    ackSuccessBody:
      "Gracias. Sofía recibirá la confirmación y seguirá con los próximos pasos del proyecto.",
    adminNotifySubject: "Identidad visual — recibido confirmado",
  },
  manual: {
    purpose: "manual",
    phaseKey: "manual",
    title: "Manual de marca",
    emailSubject: "Tu manual de marca — Soulful Branding®",
    portalTitle: "Manual de marca",
    emailIntro:
      "Tu **manual de marca** en PDF está listo. Descargalo desde el enlace y confirmá la recepción cuando lo hayas recibido.",
    ackButton: "Confirmar recibido",
    ackSuccessTitle: "Manual recibido",
    ackSuccessBody:
      "Gracias por confirmar. Sofía recibirá el aviso y quedará registrado en tu proyecto.",
    adminNotifySubject: "Manual de marca — recibido confirmado",
  },
};

export function purposeToHtmlPhaseKey(purpose: string): HtmlPhaseKey | null {
  if (purpose === "identidad" || purpose === "manual") return purpose;
  return null;
}

export function buildCustomPhaseSendConfig(title: string, phaseKey: string): PhaseSendConfig {
  const labels = customPhaseSendLabels(title);
  return {
    purpose: customPhaseAccessPurpose(phaseKey),
    phaseKey,
    ...labels,
  };
}

export function buildGenericBuiltinSendConfig(title: string, phaseKey: string): PhaseSendConfig {
  const labels = customPhaseSendLabels(title);
  return {
    purpose: genericBuiltinAccessPurpose(phaseKey),
    phaseKey,
    ...labels,
  };
}

type PhaseMap = Record<string, Record<string, string>>;

export function resolvePhaseSendConfig(
  purposeOrPhaseKey: string,
  opts?: { customTitle?: string; genericBuiltin?: boolean },
): PhaseSendConfig | null {
  if (opts?.genericBuiltin && isBuiltinProjectPhaseKey(purposeOrPhaseKey)) {
    return buildGenericBuiltinSendConfig(
      opts.customTitle ?? "Entrega",
      purposeOrPhaseKey,
    );
  }

  const genericFromPurpose = parseGenericBuiltinPhaseKeyFromPurpose(purposeOrPhaseKey);
  if (genericFromPurpose) {
    return buildGenericBuiltinSendConfig(
      opts?.customTitle ?? "Entrega",
      genericFromPurpose,
    );
  }

  const htmlKey = purposeToHtmlPhaseKey(purposeOrPhaseKey);
  if (htmlKey) return HTML_PHASE_SEND[htmlKey];

  const customFromPurpose = parseCustomPhaseKeyFromPurpose(purposeOrPhaseKey);
  if (customFromPurpose) {
    return buildCustomPhaseSendConfig(opts?.customTitle ?? "Entrega", customFromPurpose);
  }

  if (purposeOrPhaseKey.startsWith("custom-")) {
    return buildCustomPhaseSendConfig(opts?.customTitle ?? "Entrega", purposeOrPhaseKey);
  }

  return null;
}

export function isSendableClientPhaseKey(key: string, phases?: PhaseMap): boolean {
  if (key.startsWith("custom-")) return true;
  if (phases && isBuiltinPhaseGenericMode(phases, key)) return true;
  return key === "identidad" || key === "manual";
}

export type PhasePortalContext = {
  storageKey: string;
  config: PhaseSendConfig;
  isCustom: boolean;
  htmlPhaseKey: HtmlPhaseKey | null;
};

export function resolvePhasePortalContext(
  purpose: string,
  phases?: PhaseMap,
): PhasePortalContext | null {
  const htmlKey = purposeToHtmlPhaseKey(purpose);
  if (htmlKey) {
    return {
      storageKey: htmlKey,
      config: HTML_PHASE_SEND[htmlKey],
      isCustom: false,
      htmlPhaseKey: htmlKey,
    };
  }

  const customKey = parseCustomPhaseKeyFromPurpose(purpose);
  if (customKey) {
    const title = phases ? (findCustomPhaseTitle(phases, customKey) ?? "Entrega") : "Entrega";
    return {
      storageKey: customKey,
      config: buildCustomPhaseSendConfig(title, customKey),
      isCustom: true,
      htmlPhaseKey: null,
    };
  }

  const genericBuiltinKey = parseGenericBuiltinPhaseKeyFromPurpose(purpose);
  if (genericBuiltinKey) {
    const title = phases
      ? (findPhaseDisplayTitle(phases, genericBuiltinKey) ?? "Entrega")
      : "Entrega";
    return {
      storageKey: genericBuiltinKey,
      config: buildGenericBuiltinSendConfig(title, genericBuiltinKey),
      isCustom: true,
      htmlPhaseKey: null,
    };
  }

  if (purpose.startsWith("custom-")) {
    const title = phases ? (findCustomPhaseTitle(phases, purpose) ?? "Entrega") : "Entrega";
    return {
      storageKey: purpose,
      config: buildCustomPhaseSendConfig(title, purpose),
      isCustom: true,
      htmlPhaseKey: null,
    };
  }

  return null;
}

export const HTML_PHASE_KEYS = Object.keys(HTML_PHASE_SEND) as HtmlPhaseKey[];
