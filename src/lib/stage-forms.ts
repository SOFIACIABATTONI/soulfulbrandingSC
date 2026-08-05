import type { StageFormId } from "@/lib/site-content";

export type StageFormField = {
  name: string;
  label: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  /** Mapea al endpoint de contacto (nombre / email) */
  bind?: "name" | "email";
};

export type StageFormSection = {
  heading?: string;
  intro?: string;
  fields: StageFormField[];
};

export type StageFormDefinition = {
  id: StageFormId;
  /** Título corto encima del formulario */
  title: string;
  welcome: string;
  sections: StageFormSection[];
};

/** Contenido alineado con `private-notes/momentos.md` */
export const STAGE_FORMS: Record<StageFormId, StageFormDefinition> = {
  "aplicacion-inicio": {
    id: "aplicacion-inicio",
    title: "Formulario de aplicación",
    welcome:
      "Este es el primer paso para dar forma a tu marca desde un lugar consciente y estratégico. No buscamos respuestas perfectas, sino reales.",
    sections: [
      {
        heading: "Sobre ti y tu proyecto",
        fields: [
          { name: "proyecto_marca", label: "Nombre del proyecto / marca", required: true },
          { name: "name", label: "Nombre completo", required: true, bind: "name" },
          { name: "email", label: "Email", required: true, bind: "email" },
          {
            name: "dedicacion",
            label: "¿A qué te dedicas o quieres dedicarte? Cuéntamelo con tus palabras",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "estado_proyecto",
            label: "¿Tu proyecto ya está en marcha o está naciendo?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Visión y esencia",
        fields: [
          { name: "que_te_llevo", label: "¿Qué te llevó a crear este proyecto?", multiline: true, rows: 3, required: true },
          {
            name: "transformacion",
            label: "¿Qué transformación deseas generar en las personas?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "experiencia_marca",
            label: "Si tu marca fuera una experiencia, ¿cómo se sentiría?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "diferencia",
            label: "¿Qué te hace diferente, aunque aún no sepas explicarlo del todo?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Bloqueos y claridad",
        fields: [
          {
            name: "costando",
            label: "¿Qué es lo que más te está costando hoy en este proceso?",
            multiline: true,
            rows: 3,
            required: true,
          },
          { name: "miedo", label: "¿Qué miedo aparece al dar este paso?", multiline: true, rows: 2, required: true },
          {
            name: "necesitas_claridad",
            label: "¿Qué sientes que necesitas para avanzar con claridad?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Inspiración y percepción",
        fields: [
          {
            name: "marcas_inspiran",
            label: "¿Qué marcas te inspiran? ¿Por qué?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "percepcion",
            label: "¿Cómo te gustaría que las personas perciban tu marca?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Decisión y compromiso",
        fields: [
          {
            name: "momento_crear",
            label: "¿Por qué sientes que este es el momento para crear tu marca?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "compromiso",
            label: "¿Qué nivel de compromiso tienes con este proceso?",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "invertido_antes",
            label: "¿Has invertido antes en branding o diseño?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Inversión y tiempos",
        fields: [
          {
            name: "rango_inversion",
            label:
              "¿En qué rango de inversión te sientes cómodo/a para este proceso? (ej. low ticket 800–1200 EUR, mid 1500–1900 EUR, high 2700+ EUR)",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "cuando_comenzar",
            label: "¿Cuándo te gustaría comenzar?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Cierre",
        fields: [
          {
            name: "por_que_estudio",
            label: "¿Por qué sientes que mi estudio es el indicado para acompañarte?",
            multiline: true,
            rows: 4,
            required: true,
          },
        ],
      },
    ],
  },

  "contacto-evolucion": {
    id: "contacto-evolucion",
    title: "Formulario de contacto — evolución",
    welcome:
      "Este espacio es para revisar tu marca con honestidad y profundidad. Lo que hoy no encaja, también es información valiosa.",
    sections: [
      {
        heading: "Tus datos",
        fields: [
          { name: "name", label: "Nombre completo", required: true, bind: "name" },
          { name: "email", label: "Email", required: true, bind: "email" },
        ],
      },
      {
        heading: "Sobre tu marca actual",
        fields: [
          { name: "nombre_marca", label: "Nombre de marca", required: true },
          { name: "web_redes", label: "Web / redes", multiline: true, rows: 2, required: true },
          { name: "dedicacion_actual", label: "¿A qué te dedicas actualmente?", multiline: true, rows: 2, required: true },
          { name: "antiguedad", label: "¿Hace cuánto existe tu marca?", multiline: true, rows: 2, required: true },
        ],
      },
      {
        heading: "Momento actual",
        fields: [
          {
            name: "ya_no_representa",
            label: "¿Qué sientes que ya no representa quién eres hoy?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "que_ha_cambiado",
            label: "¿Qué ha cambiado en ti o en tu negocio?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "incomoda",
            label: "¿Qué parte de tu marca te incomoda o limita?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Percepción externa",
        fields: [
          {
            name: "comunica_hoy",
            label: "¿Qué crees que comunica tu marca hoy?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "que_dicen",
            label: "¿Qué te dicen otros sobre ella?",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "coherencia",
            label: "¿Sientes coherencia entre lo que eres y lo que muestras?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Profundidad",
        fields: [
          {
            name: "inercia",
            label: "¿Qué estás sosteniendo por inercia?",
            multiline: true,
            rows: 3,
            required: true,
          },
          { name: "miedo_soltar", label: "¿Qué te daría miedo soltar?", multiline: true, rows: 2, required: true },
          {
            name: "version_emerge",
            label: "¿Qué versión de tu marca está pidiendo emerger?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Dirección",
        fields: [
          {
            name: "transformar_proceso",
            label: "¿Qué te gustaría transformar a través de este proceso?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "sentirse_despues",
            label: "¿Cómo debería sentirse tu marca después de evolucionar?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Decisión",
        fields: [
          {
            name: "cambio_ahora",
            label: "¿Por qué quieres hacer este cambio ahora?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "si_no_proceso",
            label: "¿Qué pasaría si no haces este proceso?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Inversión y tiempos",
        fields: [
          { name: "rango_inversion", label: "¿Qué rango de inversión contemplas?", multiline: true, rows: 2, required: true },
          {
            name: "cuando_comenzar",
            label: "¿Cuándo te gustaría comenzar?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Cierre",
        fields: [
          {
            name: "por_que_sofia",
            label: "¿Por qué sientes que soy la persona indicada para acompañarte en esta evolución?",
            multiline: true,
            rows: 4,
            required: true,
          },
        ],
      },
    ],
  },

  "aplicacion-expansion": {
    id: "aplicacion-expansion",
    title: "Formulario de aplicación — expansión",
    welcome:
      "Tu marca ya tiene una base. Este espacio es para expandir su percepción y llevarla a nuevos niveles de expresión.",
    sections: [
      {
        heading: "Sobre tu marca",
        fields: [
          { name: "name", label: "Nombre completo", required: true, bind: "name" },
          { name: "email", label: "Email", required: true, bind: "email" },
          { name: "nombre_marca", label: "Nombre de marca", required: true },
          { name: "web_redes", label: "Web / redes", multiline: true, rows: 2, required: true },
          { name: "dedicacion", label: "¿A qué te dedicas?", multiline: true, rows: 2, required: true },
          {
            name: "construido_marca",
            label: "¿Qué ya tienes construido a nivel de marca?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Necesidad actual",
        fields: [
          {
            name: "materiales",
            label: "¿Qué tipo de materiales o piezas necesitas desarrollar?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "falta_comunicacion",
            label: "¿Qué sientes que hoy está faltando en tu comunicación?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "oportunidades",
            label: "¿Dónde estás perdiendo oportunidades de conexión o venta?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Percepción y expansión",
        fields: [
          {
            name: "percepcion_elevar",
            label: "¿Qué percepción quieres elevar en tu marca?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "nueva_etapa",
            label: "¿Cómo te gustaría que se vea y se sienta esta nueva etapa?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Estrategia",
        fields: [
          {
            name: "objetivo_expansion",
            label: "¿Cuál es el objetivo concreto de esta expansión?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "lanzamientos",
            label: "¿Hay lanzamientos, servicios o cambios próximos?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Contexto",
        fields: [
          {
            name: "equipo",
            label: "¿Trabajas con equipo o gestionas todo tú?",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "trabajado_antes",
            label: "¿Has trabajado antes con diseñadores o estudios?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Inversión y tiempos",
        fields: [
          {
            name: "rango_inversion",
            label: "¿Qué rango de inversión tienes previsto?",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "cuando_comenzar",
            label: "¿Cuándo te gustaría comenzar?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Cierre",
        fields: [
          {
            name: "por_que_estudio",
            label: "¿Por qué sientes que mi estudio es el indicado para esta etapa de tu marca?",
            multiline: true,
            rows: 4,
            required: true,
          },
        ],
      },
    ],
  },
  "servicios-info": {
    id: "servicios-info",
    title: "Formulario de servicios",
    welcome:
      "Este espacio es para revisar tu marca con honestidad y profundidad. Lo que hoy no encaja, también es información valiosa.",
    sections: [
      {
        heading: "Tus datos",
        fields: [
          { name: "name", label: "Nombre completo", required: true, bind: "name" },
          { name: "email", label: "Email", required: true, bind: "email" },
        ],
      },
      {
        heading: "Sobre tu marca actual",
        fields: [
          { name: "nombre_marca", label: "Nombre de marca", required: true },
          { name: "web_redes", label: "Web / redes", multiline: true, rows: 2, required: true },
          { name: "dedicacion_actual", label: "¿A qué te dedicas actualmente?", multiline: true, rows: 2, required: true },
          { name: "antiguedad", label: "¿Hace cuánto existe tu marca?", multiline: true, rows: 2, required: true },
        ],
      },
      {
        heading: "Momento actual",
        fields: [
          {
            name: "ya_no_representa",
            label: "¿Sientes que ya no representa quién eres hoy?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "que_ha_cambiado",
            label: "¿Qué ha cambiado en ti o en tu negocio?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "incomoda",
            label: "¿Qué parte de tu marca te incomoda o limita?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Percepción externa",
        fields: [
          {
            name: "comunica_hoy",
            label: "¿Qué crees que comunica tu marca hoy?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "que_dicen",
            label: "¿Qué te dicen otros sobre ella?",
            multiline: true,
            rows: 2,
            required: true,
          },
          {
            name: "coherencia",
            label: "¿Sientes coherencia entre lo que eres y lo que muestras?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Profundidad",
        fields: [
          {
            name: "inercia",
            label: "¿Qué estás sosteniendo por inercia?",
            multiline: true,
            rows: 3,
            required: true,
          },
          { name: "miedo_soltar", label: "¿Qué te daría miedo soltar?", multiline: true, rows: 2, required: true },
          {
            name: "version_emerge",
            label: "¿Qué versión de tu marca está pidiendo emerger?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Dirección",
        fields: [
          {
            name: "transformar_proceso",
            label: "¿Qué te gustaría transformar a través de este proceso?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "sentirse_despues",
            label: "¿Cómo debería sentirse tu marca después de evolucionar?",
            multiline: true,
            rows: 3,
            required: true,
          },
        ],
      },
      {
        heading: "Decisión",
        fields: [
          {
            name: "cambio_ahora",
            label: "¿Por qué quieres hacer este cambio ahora?",
            multiline: true,
            rows: 3,
            required: true,
          },
          {
            name: "si_no_proceso",
            label: "¿Qué pasaría si no haces este proceso?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Inversión y tiempos",
        fields: [
          { name: "rango_inversion", label: "¿Qué rango de inversión contemplas?", multiline: true, rows: 2, required: true },
          {
            name: "cuando_comenzar",
            label: "¿Cuándo te gustaría comenzar?",
            multiline: true,
            rows: 2,
            required: true,
          },
        ],
      },
      {
        heading: "Cierre",
        fields: [
          {
            name: "por_que_sofia",
            label: "¿Por qué sientes que soy la persona indicada para acompañarte en esta evolución?",
            multiline: true,
            rows: 4,
            required: true,
          },
        ],
      },
    ],
  },
};

export function getStageForm(id: StageFormId): StageFormDefinition {
  return STAGE_FORMS[id];
}

/** Arma el cuerpo del mensaje para `/api/contact` */
export function buildStageFormMessage(
  def: StageFormDefinition,
  fd: FormData,
  etapaLabel: string,
): { name: string; email: string; message: string } {
  let name = "";
  let email = "";

  const lines: string[] = [
    `[Formulario: ${def.title}]`,
    `Etapa: ${etapaLabel}`,
    "",
  ];

  for (const sec of def.sections) {
    if (sec.heading) lines.push(`— ${sec.heading} —`);
    if (sec.intro) lines.push(sec.intro, "");
    for (const f of sec.fields) {
      const raw = fd.get(f.name);
      const v = typeof raw === "string" ? raw.trim() : "";
      if (f.bind === "name") name = v;
      if (f.bind === "email") email = v;
      lines.push(`${f.label}: ${v || "(sin respuesta)"}`);
    }
    lines.push("");
  }

  return {
    name: name || "Sin nombre",
    email: email || "",
    message: lines.join("\n").trim(),
  };
}
