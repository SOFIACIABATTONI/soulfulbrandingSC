import type { Lead } from "@prisma/client";

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function formatTotal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "*A definir*";
  return `$${value.toLocaleString("en-US")} USD`;
}

/**
 * Carta de bienvenida al pre-brief (portal cliente / onboarding).
 * No usar en presupuestos — ver `buildPresupuestoMarkdown`.
 */
export const SOULFUL_PREBRIEF_WELCOME_MARKDOWN = `### Bienvenida al proceso de Soulful Branding

Antes de comenzar con el brief creativo, quiero invitarte a hacer una pequeña pausa.

El proceso que estás a punto de iniciar no es un proceso tradicional de diseño o branding.

Es un **espacio de exploración, claridad y co-creación**, donde vamos a mirar tu proyecto desde un lugar más profundo.

Mi trabajo no consiste únicamente en diseñar una identidad visual.

Consiste en **activar la esencia de tu marca y traducirla en una experiencia coherente, auténtica y magnética**.

Durante este proceso vamos a trabajar en tres niveles:

- **Esencia** — la verdad profunda de tu proyecto
- **Narrativa** — cómo esa esencia se expresa y se comunica
- **Materialización** — cómo todo eso toma forma en una identidad visual y verbal

Para que esto suceda, necesito que este primer ejercicio lo respondas desde un lugar **honesto y reflexivo**, no desde lo que crees que “debería decir una marca”.

No buscamos respuestas perfectas.

Buscamos **verdad**.

Tómate tu tiempo para responder.

Puedes escribir libremente, reflexionar, incluso dejar preguntas abiertas.

Este pre-brief es el primer paso para **abrir el campo creativo donde tu marca va a revelarse**.

Bienvenido a este proceso de **alquimia creativa**.`;

/** Texto por defecto del pre-brief (portal cliente — Bloque 8). */
export function buildPrebriefWelcomeMarkdown(): string {
  return SOULFUL_PREBRIEF_WELCOME_MARKDOWN;
}

/** Plantilla markdown de presupuesto comercial (editable antes de enviar). */
export function buildPresupuestoMarkdown(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): string {
  const serviceLabel = SERVICE_LABELS[lead.service] ?? lead.service;
  const companyLine = lead.company.trim()
    ? `${lead.company.trim()} · ${lead.email.trim()}`
    : lead.email.trim();
  const totalLine = formatTotal(lead.estimatedValue);
  const notesBlock = lead.notes.trim()
    ? lead.notes.trim()
    : "_Completá alcance, entregables y condiciones según la propuesta._";

  return `### Propuesta de presupuesto — Soulful Branding®

Hola ${firstName(lead.name)},

Gracias por tu consulta y por compartir el contexto de tu proyecto.

**Preparado para:** ${lead.name.trim()}  
${companyLine}

**Servicio:** ${serviceLabel}  
**Proceso:** Soulful Branding®

---

#### Alcance propuesto

| Etapa | Descripción | Valor |
|-------|-------------|-------|
| 01 — Onboarding | Pre-brief + sesión Deep Dive | Incluido |
| 02 — Narrativa | Construcción del relato de marca | Incluido |
| 03 — Identidad visual | Logo, paleta, tipografía, sistema visual | ${totalLine} |
| 04 — Manual de marca | Guía de uso y aplicaciones | Incluido |

#### Inversión total

**${totalLine}**

- Validez: 30 días
- Forma de pago: 50% seña al confirmar · 50% al entregar

#### Notas

${notesBlock}

---

Si esta dirección te resuena, podés **aprobar la propuesta** desde el botón de abajo o escribirme si querés consultar algún punto.

Con cariño,  
Sofía Ciabattoni  
Soulful Branding®`;
}

/** @deprecated Usar buildPrebriefWelcomeMarkdown o buildPresupuestoMarkdown */
export function buildSoulfulWelcomeMarkdown(): string {
  return buildPrebriefWelcomeMarkdown();
}

/** Video por defecto del pre-brief (YouTube/Vimeo). Definir en .env */
export function getDefaultPrebriefVideoUrl(): string | undefined {
  const url = process.env.QUOTE_DEFAULT_VIDEO_URL?.trim();
  return url || undefined;
}
