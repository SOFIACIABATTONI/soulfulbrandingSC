import { z } from "zod";

export const prebriefAnswersSchema = z.record(z.string(), z.string());

export const prebriefResponsesSchema = z.object({
  answers: prebriefAnswersSchema,
});

export type PrebriefResponses = z.infer<typeof prebriefResponsesSchema>;

export function normalizePrebriefResponses(raw: unknown): PrebriefResponses {
  const parsed = prebriefResponsesSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (raw && typeof raw === "object" && "answers" in raw) {
    const answers = (raw as { answers: unknown }).answers;
    if (answers && typeof answers === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers as Record<string, unknown>)) {
        if (typeof v === "string") out[k] = v;
      }
      return { answers: out };
    }
  }
  return { answers: {} };
}

export function hasPrebriefSubmission(responses: PrebriefResponses): boolean {
  return Object.values(responses.answers).some((v) => v.trim().length > 0);
}
