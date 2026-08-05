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
  return `€${value.toLocaleString("en-US")} EUR`;
}

/**
 * Carta de bienvenida al pre-brief (portal cliente / onboarding).
 * No usar en presupuestos — ver `buildPresupuestoMarkdown`.
 */
export const SOULFUL_PREBRIEF_WELCOME_MARKDOWN = `### Bienvenida al proceso de Soulful Branding

Antes de comenzar con Brand Soul, quiero invitarte a hacer una pequeña pausa.

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

Brand Soul es el primer paso para **abrir el campo creativo donde tu marca va a revelarse**.

Bienvenido a este proceso de **alquimia creativa**.`;

/** Texto por defecto del pre-brief (portal cliente — Bloque 8). */
export function buildPrebriefWelcomeMarkdown(): string {
  return SOULFUL_PREBRIEF_WELCOME_MARKDOWN;
}

/** Plantilla markdown de presupuesto comercial (editable antes de enviar). */
export function buildPresupuestoMarkdown(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): string {
  return buildServicePresupuestoMarkdown(lead, {
    serviceTitle: SERVICE_LABELS[lead.service] ?? lead.service,
    scopeIntro: "Proceso Soulful Branding® — identidad verbal y visual integral.",
    stages: [
      { name: "01 — Onboarding", detail: "Brand Soul + sesión Deep Dive", value: "Incluido" },
      { name: "02 — Narrativa", detail: "Construcción del relato de marca", value: "Incluido" },
      { name: "03 — Identidad visual", detail: "Logo, paleta, tipografía, sistema visual", value: "total" },
      { name: "04 — Manual de marca", detail: "Guía de uso y aplicaciones", value: "Incluido" },
    ],
  });
}

/** Propuesta Estrategia visual — carta markdown. */
export function buildEstrategiaVisualMarkdown(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): string {
  return buildServicePresupuestoMarkdown(lead, {
    serviceTitle: "Estrategia visual",
    scopeIntro:
      "Dirección estética y sistema gráfico para que tu marca se vea coherente en todos los puntos de contacto.",
    stages: [
      { name: "01 — Diagnóstico visual", detail: "Auditoría de marca y referencias estratégicas", value: "Incluido" },
      { name: "02 — Dirección creativa", detail: "Concepto visual, moodboard y criterios de sistema", value: "Incluido" },
      { name: "03 — Sistema gráfico", detail: "Paleta, tipografía, composición y aplicaciones base", value: "total" },
      { name: "04 — Entrega", detail: "Archivos editables + guía de uso visual", value: "Incluido" },
    ],
  });
}

/** Propuesta Diseño editorial — carta markdown. */
export function buildDisenoEditorialMarkdown(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
): string {
  return buildServicePresupuestoMarkdown(lead, {
    serviceTitle: "Diseño editorial",
    scopeIntro:
      "Piezas editoriales y publicaciones de marca — catálogos, dossiers, presentaciones o material impreso/digital.",
    stages: [
      { name: "01 — Brief editorial", detail: "Objetivo, formato, tono y referencias del material", value: "Incluido" },
      { name: "02 — Diseño y maquetación", detail: "Propuesta visual + composición de páginas", value: "total" },
      { name: "03 — Revisiones", detail: "Rondas de ajuste según lo acordado", value: "Incluido" },
      { name: "04 — Entrega final", detail: "PDF listo para impresión y/o archivos editables", value: "Incluido" },
    ],
  });
}

type StageRow = { name: string; detail: string; value: string };

function buildServicePresupuestoMarkdown(
  lead: Pick<Lead, "name" | "email" | "company" | "service" | "estimatedValue" | "notes">,
  opts: { serviceTitle: string; scopeIntro: string; stages: StageRow[] },
): string {
  const companyLine = lead.company.trim()
    ? `${lead.company.trim()} · ${lead.email.trim()}`
    : lead.email.trim();
  const totalLine = formatTotal(lead.estimatedValue);
  const notesBlock = lead.notes.trim()
    ? lead.notes.trim()
    : "_Completá alcance, entregables y condiciones según la propuesta._";

  const stageRows = opts.stages
    .map((s) => {
      const val = s.value === "total" ? totalLine : s.value;
      return `| ${s.name} | ${s.detail} | ${val} |`;
    })
    .join("\n");

  return `### Propuesta — ${opts.serviceTitle} · Soulful Branding®

Hola ${firstName(lead.name)},

Gracias por tu consulta y por compartir el contexto de tu proyecto.

**Preparado para:** ${lead.name.trim()}  
${companyLine}

**Servicio:** ${opts.serviceTitle}  
${opts.scopeIntro}

---

#### Alcance propuesto

| Etapa | Descripción | Valor |
|-------|-------------|-------|
${stageRows}

#### Inversión total

**${totalLine}**

- Validez: 30 días
- Forma de pago: seña por el monto acordado al confirmar · saldo al entregar

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
