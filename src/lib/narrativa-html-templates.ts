import { isPhaseHtmlBody, markdownToPhaseHtml } from "@/lib/phase-html-templates";
import type { NarrativaContent } from "@/lib/narrativa-types";
import {
  buildDefaultNarrativaContent,
  type NarrativaProjectInput,
} from "@/lib/narrativa-default-content";

export function getNarrativaHtmlTemplate(project: NarrativaProjectInput): string {
  const markdown = buildDefaultNarrativaContent(project).body;
  return markdownToPhaseHtml(markdown);
}

export function resolveNarrativaHtml(
  content: NarrativaContent,
  project?: NarrativaProjectInput,
): string {
  const body = content.body?.trim() ?? "";
  if (body) {
    if (content.format === "html" || isPhaseHtmlBody(body)) return body;
    return markdownToPhaseHtml(body);
  }
  if (project) return getNarrativaHtmlTemplate(project);
  return "";
}
