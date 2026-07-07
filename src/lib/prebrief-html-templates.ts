import { isPhaseHtmlBody, markdownToPhaseHtml } from "@/lib/phase-html-templates";

/** Contenido HTML por defecto del pre-brief (equivalente a prebrief-content.ts). */

export const PREBRIEF_EMAIL_WELCOME_HTML = `<h1>Bienvenido al proceso Soulful Branding®</h1>
<p>Estás a punto de iniciar un proceso de co-creación donde vamos a revelar, articular y materializar la esencia de tu marca.</p>
<p>Mi trabajo no consiste únicamente en diseñar una identidad visual.</p>
<p>Consiste en <strong>activar el campo creativo de tu proyecto y traducir su esencia en una experiencia de marca auténtica y magnética.</strong></p>
<p>Este proceso combina <strong>estrategia, percepción y alquimia creativa</strong>.</p>
<p>El ejercicio que encontrarás a continuación es el primer paso.</p>`;

export const PREBRIEF_PROCESS_INTRO_HTML = `<h3>Cómo funciona este proceso</h3>
<p><strong>Esencia →</strong> Revelamos el núcleo energético y conceptual de la marca.</p>
<p><strong>Narrativa →</strong> Articulamos su voz, mensaje y personalidad.</p>
<p><strong>Materialización →</strong> Traducimos a una identidad visual y experiencia de marca coherente.</p>
<p>Este proceso funciona cuando existe apertura y honestidad.<br>No buscamos respuestas "correctas". Buscamos <strong>verdad y claridad</strong>. Cuanto más profundo te permitas responder este ejercicio, más poderoso será el resultado de tu marca.</p>`;

export const PREBRIEF_DIAGNOSTIC_INTRO_HTML = `<h1>Diagnóstico de marca — Exploración de la Esencia</h1>
<p>Antes de comenzar con el desarrollo estratégico y creativo, necesitamos abrir un espacio de exploración.</p>
<p>Las siguientes preguntas están diseñadas para revelar información profunda sobre tu proyecto y su identidad. Tómate tu tiempo.</p>
<p>No hay respuestas perfectas.</p>`;

/** Intro unificada del formulario online (antes de las preguntas). */
export const PREBRIEF_QUESTIONNAIRE_INTRO_HTML = `<h2>Cómo funciona este proceso</h2>
<p><strong>Esencia →</strong> Revelamos el núcleo energético y conceptual de la marca.</p>
<p><strong>Narrativa →</strong> Articulamos su voz, mensaje y personalidad.</p>
<p><strong>Materialización →</strong> Traducimos a una identidad visual y experiencia de marca coherente.</p>
<p>Este proceso funciona cuando existe apertura y honestidad. No buscamos respuestas "correctas". Buscamos <strong>verdad y claridad</strong>. Cuanto más profundo te permitas responder este ejercicio, más poderoso será el resultado de tu marca.</p>
<h2>Diagnóstico de marca — Exploración de la Esencia</h2>
<p>Antes de comenzar con el desarrollo estratégico y creativo, necesitamos abrir un espacio de exploración.</p>
<p>Las siguientes preguntas están diseñadas para revelar información profunda sobre tu proyecto y su identidad. Tómate tu tiempo.</p>
<p>No hay respuestas perfectas.</p>`;

export const PREBRIEF_OUTRO_HTML = `<p>Gracias por tomarte el tiempo de realizar este ejercicio.</p>
<p>A partir de aquí comienza el proceso de <strong>revelación, articulación y materialización de tu marca</strong>.</p>
<p>Cada respuesta será parte del campo creativo desde el cual trabajaremos.</p>
<p>Nos vemos en la primera sesión.</p>`;

export const PREBRIEF_SECTION_RESONANCIA_HTML = `<p>Comparte algunas referencias visuales que te generen resonancia para tu proyecto.</p>
<p>Puedes incluir: marcas, proyectos, imágenes, espacios, colores, atmósferas.</p>
<p>Cuéntanos qué es lo que te atrae de ellas.</p>`;

export const PREBRIEF_SECTION_INFO_HTML = `<p>Para comprender mejor el contexto de tu marca, compártenos lo siguiente:</p>`;

/** Convierte markdown legacy o devuelve HTML tal cual. */
export function resolvePrebriefHtml(content: string): string {
  const trimmed = content?.trim() ?? "";
  if (!trimmed) return "";
  if (isPhaseHtmlBody(trimmed)) return trimmed;
  return markdownToPhaseHtml(trimmed);
}

/** HTML seguro para correos (sin clases del portal). */
export function prebriefHtmlForEmail(html: string): string {
  return resolvePrebriefHtml(html);
}
