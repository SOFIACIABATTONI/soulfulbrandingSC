import type { PhaseDocumentKey } from "@/lib/phase-document-templates";
import { markdownToQuoteHtml } from "@/lib/quote-markdown-html";

const PLACEHOLDER =
  '<span style="color:#F03172;background:rgba(240,49,114,0.12);padding:2px 6px;border-radius:4px;">[Completar]</span>';

function task(items: string[]): string {
  return `<ul data-type="taskList">${items
    .map(
      (text) =>
        `<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>${text}</p></div></li>`,
    )
    .join("")}</ul>`;
}

function table(headers: string[], rows: string[][]): string {
  const head = `<tr>${headers.map((h) => `<th><p>${h}</p></th>`).join("")}</tr>`;
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((c) => `<td><p>${c}</p></td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><tbody>${head}${body}</tbody></table>`;
}

const HTML_TEMPLATES: Record<PhaseDocumentKey, string> = {
  onboarding: `<h1>Onboarding — seguimiento interno</h1>
<h2>Checklist de inicio</h2>
${task([
  `Kickoff / primera call agendada: <strong>${PLACEHOLDER}</strong>`,
  "Contrato enviado y aceptado",
  "Seña registrada y pagada",
  `Carpetas y accesos listos (Drive, Notion, etc.): <strong>${PLACEHOLDER}</strong>`,
])}
<h2>Contexto del cliente</h2>
<p><strong>Nombre:</strong> ${PLACEHOLDER}</p>
<p><strong>Qué necesito recordar de este proyecto:</strong></p>
<p><em>${PLACEHOLDER} — tono, expectativas, sensibilidades, referencias que mencionó</em></p>
<h2>Próximos pasos</h2>
<ol><li><p>${PLACEHOLDER}</p></li><li><p>${PLACEHOLDER}</p></li></ol>
<h2>Links útiles</h2>
${table(["Recurso", "Link"], [
  ["Ficha del cliente", PLACEHOLDER],
  ["Calendario / grabaciones", PLACEHOLDER],
])}`,

  prebrief: `<h1>Pre-brief — notas internas</h1>
<h2>Antes de enviar el cuestionario</h2>
${task([
  "Revisar presupuesto aprobado y contexto del lead",
  "Personalizar la nota del mail si hace falta",
  "Enviar pre-brief al cliente (panel de arriba)",
])}
<h2>Después de recibir respuestas</h2>
<p><strong>Insights clave para la sesión Deep Dive:</strong></p>
<p><em>${PLACEHOLDER} — qué resonó, qué hay que profundizar</em></p>
<p><strong>Preguntas abiertas para la call:</strong></p>
<ol><li><p>${PLACEHOLDER}</p></li><li><p>${PLACEHOLDER}</p></li></ol>
<h2>Pendientes</h2>
<ul><li><p>${PLACEHOLDER}</p></li></ul>`,

  narrativa: `<h1>Narrativa — notas de sesión</h1>
<h2>Calls de estrategia</h2>
${table(["Sesión", "Fecha", "Grabación"], [
  ["Estrategia 1/2", PLACEHOLDER, `${PLACEHOLDER} link`],
  ["Estrategia 2/2", PLACEHOLDER, `${PLACEHOLDER} link`],
])}
<h2>Decisiones clave (antes de enviar al cliente)</h2>
<p><strong>Esencia / propósito:</strong></p>
<p><em>${PLACEHOLDER}</em></p>
<p><strong>Tono y voz:</strong></p>
<p><em>${PLACEHOLDER}</em></p>
<p><strong>Mensajes ancla:</strong></p>
<p><em>${PLACEHOLDER}</em></p>
<h2>Pendientes antes del envío</h2>
${task([
  "Revisar documento en el panel de arriba",
  "Enviar narrativa al cliente",
  PLACEHOLDER,
])}`,

  identidad: `<h1>Tu identidad visual</h1>
<p>Acá está tu Brand ID: logos, colores, tipografías y recursos listos para descargar.</p>
<p><em>Personalizá este mensaje antes de enviar al cliente.</em></p>`,

  manual: `<h1>Manual de marca — entrega</h1>
<h2>Contenido del manual</h2>
${task([
  "Introducción y esencia de marca",
  "Logo — construcción y variantes",
  "Paleta de color",
  "Tipografía",
  "Aplicaciones y ejemplos",
  "Do's and Don'ts",
])}
<h2>Archivo final</h2>
<p><strong>PDF / Notion / link de entrega:</strong> ${PLACEHOLDER}</p>
<p><strong>Fecha de entrega al cliente:</strong> ${PLACEHOLDER}</p>
<h2>Notas de cierre</h2>
<p><em>${PLACEHOLDER} — feedback del cliente, pendientes post-entrega</em></p>`,
};

export function getPhaseDocumentHtmlTemplate(phase: PhaseDocumentKey): string {
  return HTML_TEMPLATES[phase];
}

/** Convierte markdown legacy (notas guardadas antes del editor visual). */
export function markdownToPhaseHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      parts.push(`<h1>${escapeInline(line.slice(2).trim())}</h1>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      parts.push(`<h2>${escapeInline(line.slice(3).trim())}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      parts.push(`<h3>${escapeInline(line.slice(4).trim())}</h3>`);
      i++;
      continue;
    }

    if (line.match(/^-\s\[[ xX]\]\s/)) {
      const tasks: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^-\s\[[ xX]\]\s/)) {
        const m = lines[i].trim().match(/^-\s\[([ xX])\]\s(.+)$/);
        if (m) {
          const checked = m[1].toLowerCase() === "x";
          tasks.push(
            `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? ' checked="checked"' : ""}><span></span></label><div><p>${escapeInline(m[2])}</p></div></li>`,
          );
        }
        i++;
      }
      parts.push(`<ul data-type="taskList">${tasks.join("")}</ul>`);
      continue;
    }

    if (line.startsWith("|") && lines[i + 1]?.includes("---")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row
            .split("|")
            .slice(1, -1)
            .map((c) => escapeInline(c.trim()));
        const headers = parseRow(tableLines[0]);
        const rows = tableLines.slice(2).map(parseRow);
        parts.push(
          `<table><tbody><tr>${headers.map((h) => `<th><p>${h}</p></th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td><p>${c}</p></td>`).join("")}</tr>`).join("")}</tbody></table>`,
        );
      }
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ") && !lines[i].trim().match(/^-\s\[[ xX]\]/)) {
        items.push(`<li><p>${escapeInline(lines[i].trim().slice(2))}</p></li>`);
        i++;
      }
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(`<li><p>${escapeInline(lines[i].trim().replace(/^\d+\.\s/, ""))}</p></li>`);
        i++;
      }
      parts.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    parts.push(`<p>${escapeInline(line.trim())}</p>`);
    i++;
  }

  return parts.join("\n") || markdownToQuoteHtml(markdown);
}

function escapeInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

export function isPhaseHtmlBody(body: string): boolean {
  const t = body.trim();
  return t.startsWith("<") && (t.includes("<p>") || t.includes("<h1") || t.includes("<ul"));
}

export function resolvePhaseDocumentHtml(
  phase: PhaseDocumentKey,
  saved: Record<string, string>,
): string {
  const body = saved.body?.trim() ?? "";
  if (body) {
    if (saved.bodyFormat === "html" || isPhaseHtmlBody(body)) return body;
    return markdownToPhaseHtml(body);
  }
  const legacyParts: string[] = [];
  const labels: Record<string, string> = {
    overview: "Resumen",
    objective: "Objetivo",
    deliverables: "Entregables",
    assets: "Links",
    notes: "Notas",
  };
  for (const [key, label] of Object.entries(labels)) {
    const val = saved[key]?.trim();
    if (val) legacyParts.push(`## ${label}\n\n${val}`);
  }
  if (legacyParts.length) return markdownToPhaseHtml(legacyParts.join("\n\n"));
  return "";
}
