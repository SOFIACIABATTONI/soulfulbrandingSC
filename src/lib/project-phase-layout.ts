import {
  DEFAULT_PROJECT_PHASES,
  GENERIC_PROJECT_PHASE_FALLBACK,
  isBuiltinProjectPhaseKey,
  type ProjectPhaseDefinition,
} from "@/lib/project-phase-catalog";

export const PROJECT_LAYOUT_STORAGE_KEY = "_layout";

export const GENERIC_CLIENT_PHASE_DESC =
  "Documento para el cliente — contenido editable y envío por mail.";

export type CustomPhaseDefinition = {
  key: string;
  title: string;
  desc: string;
};

export type BuiltinPhaseOverride = {
  key: string;
  title?: string;
  desc?: string;
};

type PhaseMap = Record<string, Record<string, string>>;

const BUILTIN_OVERRIDES_LAYOUT_KEY = "builtinPhaseOverrides";

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

export function parseBuiltinPhaseOverrides(phases: PhaseMap): BuiltinPhaseOverride[] {
  const layout = phases[PROJECT_LAYOUT_STORAGE_KEY];
  const raw = layout?.[BUILTIN_OVERRIDES_LAYOUT_KEY]?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => {
        const key = String(item.key ?? "");
        const title = typeof item.title === "string" ? item.title.trim() : undefined;
        const desc = typeof item.desc === "string" ? item.desc.trim() : undefined;
        const entry: BuiltinPhaseOverride = { key };
        if (title) entry.title = title;
        if (desc) entry.desc = desc;
        return entry;
      })
      .filter((item) => isBuiltinProjectPhaseKey(item.key));
  } catch {
    return [];
  }
}

export function serializeBuiltinPhaseOverrides(defs: BuiltinPhaseOverride[]): string {
  return JSON.stringify(defs);
}

function applyBuiltinPhaseOverride(
  def: ProjectPhaseDefinition,
  override?: BuiltinPhaseOverride,
): ProjectPhaseDefinition {
  const title = override?.title?.trim() || def.title;
  const titleIsDefault = title === def.title;

  if (titleIsDefault) {
    const desc = override?.desc?.trim() || def.desc;
    return { ...def, title, desc };
  }

  return {
    ...def,
    title,
    desc: override?.desc?.trim() || GENERIC_CLIENT_PHASE_DESC,
    genericClient: true,
  };
}

export function buildProjectPhaseList(
  customDefs: CustomPhaseDefinition[],
  builtinOverrides: BuiltinPhaseOverride[] = [],
): ProjectPhaseDefinition[] {
  const mergedBuiltins = DEFAULT_PROJECT_PHASES.map((def) => {
    const override = builtinOverrides.find((o) => o.key === def.key);
    return applyBuiltinPhaseOverride(def, override);
  });

  const customPhases: ProjectPhaseDefinition[] = customDefs.map((def, index) => ({
    key: def.key,
    title: def.title.trim() || `Etapa ${DEFAULT_PROJECT_PHASES.length + index + 1}`,
    desc: def.desc.trim() || GENERIC_CLIENT_PHASE_DESC,
    cover: "/admin/project-phases/testimonio.jpg",
    fallback: GENERIC_PROJECT_PHASE_FALLBACK,
    builtin: false,
    genericClient: true,
  }));
  return [...mergedBuiltins, ...customPhases];
}

export function findBuiltinPhaseOverride(
  phases: PhaseMap,
  phaseKey: string,
): BuiltinPhaseOverride | undefined {
  return parseBuiltinPhaseOverrides(phases).find((d) => d.key === phaseKey);
}

export function resolveBuiltinPhaseTitle(phases: PhaseMap, phaseKey: string): string {
  const def = DEFAULT_PROJECT_PHASES.find((p) => p.key === phaseKey);
  if (!def) return phaseKey;
  const override = findBuiltinPhaseOverride(phases, phaseKey);
  return override?.title?.trim() || def.title;
}

export function isBuiltinPhaseGenericMode(phases: PhaseMap, phaseKey: string): boolean {
  const def = DEFAULT_PROJECT_PHASES.find((p) => p.key === phaseKey);
  if (!def) return false;
  return resolveBuiltinPhaseTitle(phases, phaseKey) !== def.title;
}

export function resolvePhaseCoverImage(content?: { coverUrl?: string }): string | null {
  const url = content?.coverUrl?.trim();
  if (!url) return null;
  return `url("${url}")`;
}

export function hasPhaseCoverImage(content?: { coverUrl?: string }): boolean {
  return Boolean(content?.coverUrl?.trim());
}

export function defaultPhaseCoverAsset(
  phase: Pick<ProjectPhaseDefinition, "cover" | "fallback">,
): string {
  return phase.cover?.trim() || phase.fallback?.trim() || "";
}

export function customPhaseAccessPurpose(phaseKey: string): string {
  return `fase-${phaseKey}`;
}

export function genericBuiltinAccessPurpose(phaseKey: string): string {
  return `fase-generic-${phaseKey}`;
}

export function parseCustomPhaseKeyFromPurpose(purpose: string): string | null {
  if (!purpose.startsWith("fase-custom-")) return null;
  return purpose.slice("fase-".length);
}

export function parseGenericBuiltinPhaseKeyFromPurpose(purpose: string): string | null {
  const prefix = "fase-generic-";
  if (!purpose.startsWith(prefix)) return null;
  const key = purpose.slice(prefix.length);
  return isBuiltinProjectPhaseKey(key) ? key : null;
}

export function isGenericPhasePortalPurpose(purpose: string): boolean {
  return (
    parseCustomPhaseKeyFromPurpose(purpose) !== null ||
    parseGenericBuiltinPhaseKeyFromPurpose(purpose) !== null
  );
}

export function findCustomPhaseTitle(
  phases: PhaseMap,
  phaseKey: string,
): string | null {
  const defs = parseCustomPhaseDefinitions(phases);
  return defs.find((d) => d.key === phaseKey)?.title ?? null;
}

export function findPhaseDisplayTitle(phases: PhaseMap, phaseKey: string): string | null {
  if (phaseKey.startsWith("custom-")) {
    return findCustomPhaseTitle(phases, phaseKey);
  }
  if (isBuiltinProjectPhaseKey(phaseKey)) {
    return resolveBuiltinPhaseTitle(phases, phaseKey);
  }
  return null;
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
