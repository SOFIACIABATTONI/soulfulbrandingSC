import { z } from "zod";
import {
  PREBRIEF_FIELDS,
  type PrebriefField,
} from "@/lib/prebrief-content";
import {
  PREBRIEF_EMAIL_WELCOME_HTML,
  PREBRIEF_OUTRO_HTML,
  PREBRIEF_QUESTIONNAIRE_INTRO_HTML,
  PREBRIEF_SECTION_INFO_HTML,
  PREBRIEF_SECTION_RESONANCIA_HTML,
  resolvePrebriefHtml,
} from "@/lib/prebrief-html-templates";
import { parseProjectPhases } from "@/lib/prebrief-service";

const prebriefFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  hint: z.string().optional(),
  rows: z.number().optional(),
  sectionTitle: z.string().optional(),
  sectionIntro: z.string().optional(),
  hidden: z.boolean().optional(),
});

const prebriefTemplateStoredSchema = z.object({
  contentFormat: z.enum(["html", "markdown"]).optional(),
  emailWelcome: z.string().optional(),
  questionnaireIntro: z.string().optional(),
  /** @deprecated Usar questionnaireIntro */
  processIntro: z.string().optional(),
  /** @deprecated Usar questionnaireIntro */
  diagnosticIntro: z.string().optional(),
  outro: z.string().optional(),
  fields: z.array(prebriefFieldSchema).optional(),
});

export const prebriefTemplateSchema = z.object({
  contentFormat: z.enum(["html", "markdown"]).optional(),
  emailWelcome: z.string(),
  questionnaireIntro: z.string(),
  outro: z.string(),
  fields: z.array(prebriefFieldSchema),
});

export type PrebriefTemplate = z.infer<typeof prebriefTemplateSchema>;

export function getDefaultPrebriefTemplate(): PrebriefTemplate {
  const fields = PREBRIEF_FIELDS.map((f) => {
    const copy = { ...f };
    if (f.id === "resonancia_visual" && f.sectionIntro) {
      copy.sectionIntro = PREBRIEF_SECTION_RESONANCIA_HTML;
    }
    if (f.id === "info_servicios" && f.sectionIntro) {
      copy.sectionIntro = PREBRIEF_SECTION_INFO_HTML;
    }
    return copy;
  });

  return {
    contentFormat: "html",
    emailWelcome: PREBRIEF_EMAIL_WELCOME_HTML,
    questionnaireIntro: PREBRIEF_QUESTIONNAIRE_INTRO_HTML,
    outro: PREBRIEF_OUTRO_HTML,
    fields,
  };
}

function resolveBlock(value: string | undefined, fallback: string): string {
  const raw = value?.trim() || fallback;
  return resolvePrebriefHtml(raw);
}

function resolveQuestionnaireIntro(
  stored: z.infer<typeof prebriefTemplateStoredSchema>,
  defaults: PrebriefTemplate,
): string {
  if (stored.questionnaireIntro?.trim()) {
    return resolveBlock(stored.questionnaireIntro, defaults.questionnaireIntro);
  }

  const hasLegacy = Boolean(stored.processIntro?.trim() || stored.diagnosticIntro?.trim());
  if (hasLegacy) {
    const process = stored.processIntro?.trim()
      ? resolvePrebriefHtml(stored.processIntro)
      : "";
    const diagnostic = stored.diagnosticIntro?.trim()
      ? resolvePrebriefHtml(stored.diagnosticIntro)
      : "";
    return `${process}${diagnostic}` || defaults.questionnaireIntro;
  }

  return defaults.questionnaireIntro;
}

function readTemplateFromPhaseBlock(
  block: Record<string, string> | undefined,
): z.infer<typeof prebriefTemplateStoredSchema> {
  if (!block) return {};
  const raw = block.template;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = prebriefTemplateStoredSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export function resolvePrebriefTemplate(phasesRaw: unknown): PrebriefTemplate {
  const phases = parseProjectPhases(phasesRaw);
  const stored = readTemplateFromPhaseBlock(phases.prebrief);
  const defaults = getDefaultPrebriefTemplate();
  const format = stored.contentFormat ?? defaults.contentFormat;

  const fields =
    stored.fields && stored.fields.length > 0
      ? mergePrebriefFields(defaults.fields, stored.fields)
      : defaults.fields;

  return mergePrebriefTemplateWithDefaults({
    contentFormat: format,
    emailWelcome: resolveBlock(stored.emailWelcome, defaults.emailWelcome),
    questionnaireIntro: resolveQuestionnaireIntro(stored, defaults),
    outro: resolveBlock(stored.outro, defaults.outro),
    fields,
  });
}

function mergePrebriefFields(
  defaults: PrebriefField[],
  stored: PrebriefField[],
): PrebriefField[] {
  const defaultsById = new Map(defaults.map((f) => [f.id, f]));
  return stored.map((custom) => {
    const def = defaultsById.get(custom.id);
    if (!def) {
      return { ...custom };
    }
    const merged = {
      ...def,
      ...custom,
      id: def.id,
    };
    if (merged.sectionIntro) {
      merged.sectionIntro = resolveBlock(custom.sectionIntro, def.sectionIntro ?? "");
    }
    return merged;
  });
}

/** Genera un id único para una pregunta custom del cuestionario. */
export function nextPrebriefFieldId(existing: PrebriefField[]): string {
  const ids = new Set(existing.map((f) => f.id));
  let n = existing.length + 1;
  while (ids.has(`custom_q${n}`)) n += 1;
  return `custom_q${n}`;
}

export function createPrebriefQuestionField(existing: PrebriefField[]): PrebriefField {
  return {
    id: nextPrebriefFieldId(existing),
    label: "Nueva pregunta",
    hint: "",
    rows: 4,
  };
}

export function createPrebriefSectionField(existing: PrebriefField[]): PrebriefField {
  return {
    id: nextPrebriefFieldId(existing),
    sectionTitle: "Nueva sección",
    sectionIntro: "",
    label: "Pregunta de la sección",
    hint: "",
    rows: 4,
  };
}

/** Preguntas visibles en el formulario del cliente. */
export function visiblePrebriefFields(fields: PrebriefField[]): PrebriefField[] {
  return fields.filter((f) => !f.hidden);
}

const DEFAULT_FIELD_IDS = new Set(PREBRIEF_FIELDS.map((f) => f.id));

export function isCustomPrebriefFieldId(id: string): boolean {
  return !DEFAULT_FIELD_IDS.has(id);
}

/** Asegura que todas las preguntas oficiales estén en la plantilla (una sola lista). */
export function mergePrebriefTemplateWithDefaults(template: PrebriefTemplate): PrebriefTemplate {
  const defaults = getDefaultPrebriefTemplate();
  const existingById = new Map(template.fields.map((f) => [f.id, f]));
  const mergedDefaults = defaults.fields.map((def) => {
    const existing = existingById.get(def.id);
    if (!existing) return { ...def, hidden: false };
    return {
      ...def,
      ...existing,
      id: def.id,
      sectionTitle: existing.sectionTitle ?? def.sectionTitle,
      sectionIntro: existing.sectionIntro ?? def.sectionIntro,
    };
  });
  const custom = template.fields.filter((f) => !DEFAULT_FIELD_IDS.has(f.id));
  return { ...template, fields: [...mergedDefaults, ...custom] };
}

export type PrebriefPackagePreset = "inicial" | "intermedio" | "completo";

const PREBRIEF_PRESET_VISIBLE_IDS: Record<PrebriefPackagePreset, Set<string> | null> = {
  inicial: new Set([
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "resonancia_visual",
  ]),
  intermedio: new Set([
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9",
    "q10",
    "resonancia_visual",
  ]),
  completo: null,
};

export function applyPrebriefPackagePreset(
  template: PrebriefTemplate,
  preset: PrebriefPackagePreset,
): PrebriefTemplate {
  const visible = PREBRIEF_PRESET_VISIBLE_IDS[preset];
  if (!visible) {
    return {
      ...template,
      fields: template.fields.map((f) => ({ ...f, hidden: false })),
    };
  }
  return {
    ...template,
    fields: template.fields.map((f) => ({
      ...f,
      hidden: !visible.has(f.id),
    })),
  };
}

export function serializePrebriefTemplateForPhases(
  phasesRaw: unknown,
  template: PrebriefTemplate,
): Record<string, Record<string, string>> {
  const phases = parseProjectPhases(phasesRaw);
  const prebrief = { ...(phases.prebrief ?? {}) };
  prebrief.template = JSON.stringify(template);
  return { ...phases, prebrief };
}
