import type { AccessPurpose } from "@/lib/contract-types";

/** Fases cuyo documento HTML (phases.*.body) se envía al cliente por mail. */
export type HtmlPhaseKey = "identidad" | "manual";

export type PhaseSendConfig = {
  purpose: AccessPurpose;
  phaseKey: HtmlPhaseKey;
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

export const HTML_PHASE_KEYS = Object.keys(HTML_PHASE_SEND) as HtmlPhaseKey[];
