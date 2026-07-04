/** Contenido oficial del pre-brief (private-notes/prebrief.md). */

export type PrebriefField = {
  id: string;
  label: string;
  hint?: string;
  rows?: number;
  sectionTitle?: string;
  sectionIntro?: string;
};

export const PREBRIEF_INTRO_WELCOME = `# Bienvenido al proceso Soulful Branding®

Estás a punto de iniciar un proceso de co-creación donde vamos a revelar, articular y materializar la esencia de tu marca.

Mi trabajo no consiste únicamente en diseñar una identidad visual.

Consiste en **activar el campo creativo de tu proyecto y traducir su esencia en una experiencia de marca auténtica y magnética.**

Este proceso combina **estrategia, percepción y alquimia creativa**.

El ejercicio que encontrarás a continuación es el primer paso.`;

export const PREBRIEF_INTRO_PROCESS = `### Cómo funciona este proceso

**Esencia →** Revelamos el núcleo energético y conceptual de la marca.

**Narrativa →** Articulamos su voz, mensaje y personalidad.

**Materialización →** Traducimos a una identidad visual y experiencia de marca coherente.

Este proceso funciona cuando existe apertura y honestidad.
No buscamos respuestas "correctas". Buscamos **verdad y claridad**. Cuanto más profundo te permitas responder este ejercicio, más poderoso será el resultado de tu marca.`;

export const PREBRIEF_INTRO_DIAGNOSTIC = `# Diagnóstico de marca — Exploración de la Esencia

Antes de comenzar con el desarrollo estratégico y creativo, necesitamos abrir un espacio de exploración.

Las siguientes preguntas están diseñadas para revelar información profunda sobre tu proyecto y su identidad. Tómate tu tiempo.

No hay respuestas perfectas.`;

export const PREBRIEF_FIELDS: PrebriefField[] = [
  {
    id: "q1",
    label: "¿Qué te impulsó realmente a crear este proyecto?",
    hint: "No la versión que sueles contar públicamente, sino el momento o la sensación interna que lo hizo inevitable.",
    rows: 4,
  },
  {
    id: "q2",
    label: "Si tu proyecto fuera una persona, ¿cómo sería su personalidad?",
    hint: "Describe su energía, temperamento, forma de hablar y presencia en el mundo.",
    rows: 4,
  },
  {
    id: "q3",
    label: "¿Qué es lo que más te incomoda o te frustra del estado actual de tu marca?",
    hint: "A veces ahí se encuentra exactamente lo que necesita transformarse.",
    rows: 4,
  },
  {
    id: "q4",
    label: "¿Qué crees que tu marca vino a cambiar o aportar en tu sector?",
    hint: "¿Qué conversación nueva quiere abrir?",
    rows: 4,
  },
  {
    id: "q5",
    label: "¿Qué partes de ti están reflejadas en tu marca?",
    hint: "Tu historia personal, valores, búsquedas o aprendizajes que inevitablemente forman parte de ella.",
    rows: 4,
  },
  {
    id: "q6",
    label: "¿Qué tipo de personas deberían sentirse profundamente vistas por tu proyecto?",
    hint: "Descríbelas más desde lo humano que desde lo demográfico.",
    rows: 4,
  },
  {
    id: "q7",
    label: "¿Qué tipo de marcas o proyectos te generan admiración o resonancia?",
    hint: "No necesariamente del mismo sector. Cuéntame qué es lo que te atrae de ellas.",
    rows: 4,
  },
  {
    id: "q8",
    label: "¿Qué emociones o estados te gustaría que alguien experimente al entrar en contacto con tu marca?",
    hint: "Piensa en sensaciones más que en conceptos de marketing.",
    rows: 4,
  },
  {
    id: "q9",
    label: "¿Qué parte de tu proyecto sientes que aún no has sabido comunicar bien?",
    hint: "Aquello que sabes que existe, pero todavía no encuentra las palabras o la forma.",
    rows: 4,
  },
  {
    id: "q10",
    label: "Si tu marca pudiera decir una sola frase al mundo, ¿cuál sería?",
    hint: "No tiene que ser perfecta. Solo auténtica.",
    rows: 3,
  },
  {
    id: "resonancia_visual",
    sectionTitle: "Resonancia Visual",
    sectionIntro:
      "Comparte algunas referencias visuales que te generen resonancia para tu proyecto.\n\nPuedes incluir: marcas, proyectos, imágenes, espacios, colores, atmósferas.\n\nCuéntanos qué es lo que te atrae de ellas.",
    label: "Tus referencias visuales y qué te atrae de ellas",
    rows: 5,
  },
  {
    id: "info_servicios",
    sectionTitle: "Información del Proyecto",
    sectionIntro:
      "Para comprender mejor el contexto de tu marca, compártenos lo siguiente:",
    label: "Servicios o productos principales",
    rows: 3,
  },
  {
    id: "info_oferta",
    label: "Oferta actual",
    rows: 3,
  },
  {
    id: "info_plataformas",
    label: "Plataformas donde tu marca está presente actualmente (web, instagram, etc.)",
    rows: 3,
  },
  {
    id: "info_lanzamientos",
    label: "Próximos proyectos o lanzamientos que debamos considerar",
    rows: 3,
  },
];

export const PREBRIEF_OUTRO = `Gracias por tomarte el tiempo de realizar este ejercicio.

A partir de aquí comienza el proceso de **revelación, articulación y materialización de tu marca**.

Cada respuesta será parte del campo creativo desde el cual trabajaremos.

Nos vemos en la primera sesión.`;

export function getPrebriefFieldById(id: string): PrebriefField | undefined {
  return PREBRIEF_FIELDS.find((f) => f.id === id);
}
