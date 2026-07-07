/** Plantillas guía por fase — reemplazá cada [Completar] o _[texto]_ con tu contenido. */

export type PhaseDocumentKey =
  | "onboarding"
  | "prebrief"
  | "narrativa"
  | "identidad"
  | "manual";

export const PHASE_DOCUMENT_HINTS: Record<PhaseDocumentKey, string> = {
  onboarding:
    "Checklist y notas del inicio del proyecto. El contrato y la seña están arriba en esta misma sección.",
  prebrief:
    "Tus notas internas. El cuestionario al cliente se envía desde el panel de arriba.",
  narrativa:
    "Notas de sesión y seguimiento. El documento para el cliente se edita y envía en el panel de arriba.",
  identidad:
    "Mensaje breve para el cliente (aparece debajo del Brand ID). Las notas de desarrollo van en otras fases o en Drive.",
  manual:
    "Checklist del manual de marca y link al PDF o Notion de entrega.",
};

export const PHASE_DOCUMENT_TITLES: Record<PhaseDocumentKey, string> = {
  onboarding: "Guía de onboarding",
  prebrief: "Notas del pre-brief",
  narrativa: "Notas de la narrativa",
  identidad: "Mensaje al cliente — identidad visual",
  manual: "Manual de marca",
};

const TEMPLATES: Record<PhaseDocumentKey, string> = {
  onboarding: `# Onboarding — seguimiento interno

## Checklist de inicio

- [ ] Kickoff / primera call agendada: **[Completar fecha]**
- [ ] Contrato enviado y aceptado
- [ ] Seña registrada y pagada
- [ ] Carpetas y accesos listos (Drive, Notion, etc.): **[Completar links]**

## Contexto del cliente

**Nombre:** [Completar]

**Qué necesito recordar de este proyecto:**

_[Completar — tono, expectativas, sensibilidades, referencias que mencionó]_

## Próximos pasos

1. [Completar]
2. [Completar]

## Links útiles

| Recurso | Link |
| --- | --- |
| Ficha del cliente | [Completar] |
| Calendario / grabaciones | [Completar] |`,

  prebrief: `# Pre-brief — notas internas

## Antes de enviar el cuestionario

- [ ] Revisar presupuesto aprobado y contexto del lead
- [ ] Personalizar la nota del mail si hace falta
- [ ] Enviar pre-brief al cliente (panel de arriba)

## Después de recibir respuestas

**Insights clave para la sesión Deep Dive:**

_[Completar — qué resonó, qué hay que profundizar]_

**Preguntas abiertas para la call:**

1. [Completar]
2. [Completar]

## Pendientes

- [Completar]`,

  narrativa: `# Narrativa — notas de sesión

## Calls de estrategia

| Sesión | Fecha | Grabación |
| --- | --- | --- |
| Estrategia 1/2 | [Completar] | [Completar link] |
| Estrategia 2/2 | [Completar] | [Completar link] |

## Decisiones clave (antes de enviar al cliente)

**Esencia / propósito:**

_[Completar]_

**Tono y voz:**

_[Completar]_

**Mensajes ancla:**

_[Completar]_

## Pendientes antes del envío

- [ ] Revisar documento en el panel de arriba
- [ ] Enviar narrativa al cliente
- [ ] [Completar]`,

  identidad: `# Identidad visual — desarrollo

## Dirección creativa acordada

_[Completar — concepto, mood, referencias visuales validadas]_

## Sistema visual

**Paleta**

| Rol | Color | Notas |
| --- | --- | --- |
| Primario | [Completar] | [Completar] |
| Secundario | [Completar] | [Completar] |
| Acento | [Completar] | [Completar] |

**Tipografía**

- Titulares: [Completar]
- Cuerpo: [Completar]

## Entregables

- [ ] Logo / isotipo / variantes
- [ ] Paleta y tipografías exportadas
- [ ] Aplicaciones (mockups, piezas clave)
- [ ] Archivos finales en Drive / Figma

## Links

| Recurso | URL |
| --- | --- |
| Figma | [Completar] |
| Drive | [Completar] |
| Referencias | [Completar] |`,

  manual: `# Manual de marca — entrega

## Contenido del manual

- [ ] Introducción y esencia de marca
- [ ] Logo — construcción y variantes
- [ ] Paleta de color
- [ ] Tipografía
- [ ] Aplicaciones y ejemplos
- [ ] Do's and Don'ts

## Archivo final

**PDF / Notion / link de entrega:** [Completar]

**Fecha de entrega al cliente:** [Completar]

## Notas de cierre

_[Completar — feedback del cliente, pendientes post-entrega]_`,
};

export function getPhaseDocumentTemplate(phase: PhaseDocumentKey): string {
  return TEMPLATES[phase];
}

export function migrateLegacyPhaseFields(saved: Record<string, string>): string {
  const parts: string[] = [];
  const labels: Record<string, string> = {
    overview: "Resumen",
    objective: "Objetivo",
    deliverables: "Entregables",
    assets: "Links",
    notes: "Notas",
  };
  for (const [key, label] of Object.entries(labels)) {
    const val = saved[key]?.trim();
    if (val) parts.push(`## ${label}\n\n${val}`);
  }
  return parts.join("\n\n");
}

export function resolvePhaseDocumentBody(
  phase: PhaseDocumentKey,
  saved: Record<string, string>,
): string {
  if (saved.body?.trim()) return saved.body;
  const legacy = migrateLegacyPhaseFields(saved);
  if (legacy.trim()) return legacy;
  return "";
}
