import {
  DEFAULT_PROJECT_PHASES,
  GENERIC_PROJECT_PHASE_FALLBACK,
  type ProjectPhaseDefinition,
} from "@/lib/project-phase-catalog";

export const PROJECT_LAYOUT_STORAGE_KEY = "_layout";

export type CustomPhaseDefinition = {
  key: string;
  title: string;
  desc: string;
};

type PhaseMap = Record<string, Record<string, string>>;

export function createCustomProjectPhaseId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseCustomPhaseDefinitions(phases: PhaseMap): CustomPhaseDefinition[] {
  const layout = phases[PROJECT_LAYOUT_STORAGE_KEY];
  const raw = layout?.customPhases?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        key: String(item.key ?? ""),
        title: String(item.title ?? "Nueva etapa"),
        desc: String(item.desc ?? ""),
      }))
      .filter((item) => item.key.startsWith("custom-"));
  } catch {
    return [];
  }
}

export function serializeCustomPhaseDefinitions(defs: CustomPhaseDefinition[]): string {
  return JSON.stringify(defs);
}

export function buildProjectPhaseList(customDefs: CustomPhaseDefinition[]): ProjectPhaseDefinition[] {
  const customPhases: ProjectPhaseDefinition[] = customDefs.map((def, index) => ({
    key: def.key,
    title: def.title.trim() || `Etapa ${DEFAULT_PROJECT_PHASES.length + index + 1}`,
    desc: def.desc.trim() || "Documento para el cliente — contenido editable y envío por mail.",
    cover: "/admin/project-phases/testimonio.jpg",
    fallback: GENERIC_PROJECT_PHASE_FALLBACK,
    builtin: false,
    genericClient: true,
  }));
  return [...DEFAULT_PROJECT_PHASES, ...customPhases];
}

export function resolvePhaseCoverImage(content?: { coverUrl?: string }): string | null {
  const url = content?.coverUrl?.trim();
  if (!url) return null;
  return `url("${url}")`;
}

export function hasPhaseCoverImage(content?: { coverUrl?: string }): boolean {
  return Boolean(content?.coverUrl?.trim());
}

export function customPhaseAccessPurpose(phaseKey: string): string {
  return `fase-${phaseKey}`;
}

export function parseCustomPhaseKeyFromPurpose(purpose: string): string | null {
  if (!purpose.startsWith("fase-custom-")) return null;
  return purpose.slice("fase-".length);
}

export function findCustomPhaseTitle(
  phases: PhaseMap,
  phaseKey: string,
): string | null {
  const defs = parseCustomPhaseDefinitions(phases);
  return defs.find((d) => d.key === phaseKey)?.title ?? null;
}

export function customPhaseSendLabels(title: string) {
  const label = title.trim() || "Entrega";
  return {
    title: label,
    emailSubject: `${label} — Soulful Branding®`,
    portalTitle: label,
    emailIntro: `Tu documento **${label}** está listo para revisar. Confirmá la recepción cuando lo hayas visto.`,
    ackButton: "Confirmar recibido",
    ackSuccessTitle: "Recibido confirmado",
    ackSuccessBody:
      "Gracias. Sofía recibirá la confirmación y quedará registrado en tu proyecto.",
    adminNotifySubject: `${label} — recibido confirmado`,
  };
}
