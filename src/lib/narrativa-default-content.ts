import type { Client } from "@prisma/client";
import { normalizeNarrativaContent, type NarrativaContent } from "@/lib/narrativa-types";

/** Plantilla base — private-notes/narrativa.md */
export const NARRATIVA_DEFAULT_BODY = `# 3) Estrategia de marca

### Base del desarrollo

1. Esencia, visión y mensajes clave.
2. Tono, voz y estilo de comunicación.
3. Storytelling y arquetipos de marca.
4. Dirección creativa verbal + manual estratégico.

| Posicionamiento | _[Completar]_ |
| --- | --- |
| Audiencia | _[Completar]_ |
| Tono y Voz | _[Completar]_ |
| Propuesta de valor | _[Completar]_ |

---

**Estrategia 1/2 — Call introductoria**

_[Enlace / referencia a la grabación de la sesión]_

## 1.1 · Esencia

**El núcleo de la marca**

_[Descripción del núcleo de la marca]_

| Propósito | _[Completar]_ |
| --- | --- |
| Diferencial | _[Completar]_ |
| Territorio | _[Completar]_ |

**Frase esencia — para uso interno, no necesariamente publicitario**

_[Frase esencia]_

## 1.2 · Visión

**Hacia dónde va**

_[Descripción de la visión]_

CONCEPTOS

1. _[Completar]_
2. _[Completar]_
3. _[Completar]_
4. _[Completar]_
5. _[Completar]_

## 1.3 · Mensajes clave

**Lo que la marca dice — en distintas capas**

**A. Para quien no sabe que la necesita**

1. **_[Título del mensaje]_**
    1. _[Desarrollo del mensaje]_
2. **_[Título del mensaje]_**
    1. _[Desarrollo del mensaje]_
3. **_[Título del mensaje]_**
    1. _[Desarrollo del mensaje]_

**B. Para quien ya entendió y está considerando**

1. **_[Título del mensaje]_**
    1. _[Desarrollo del mensaje]_
2. **_[Título del mensaje]_**
    1. _[Desarrollo del mensaje]_

**Mensaje ancla — el que unifica todo**

_[Mensaje ancla]_

---

## 2.1 · Tono y voz

**Cómo suena cuando habla**

_[Descripción del tono y la voz]_

**Cualidades de voz**

_[Cualidad · Cualidad · Cualidad · ...]_

**Lo que nunca es**

_[No es... · No es... · No es... · ...]_

**En la práctica — cómo se traduce el tono**

| NO | SI |
| --- | --- |
| _[Frase genérica]_ | _[Frase en tono de marca]_ |
| _[Frase genérica]_ | _[Frase en tono de marca]_ |
| _[Frase genérica]_ | _[Frase en tono de marca]_ |
| _[Frase genérica]_ | _[Frase en tono de marca]_ |

## 2.2 · Estilo de comunicación

**Cómo estructurar el mensaje**

**Referencias de tono**

| _[Principio 1]_ | _[Principio 2]_ | _[Principio 3]_ |
| --- | --- | --- |
| _[Descripción]_ | _[Descripción]_ | _[Descripción]_ |

_[Imagen / energía de la marca en una línea]_

**Principio rector de comunicación**

_[Principio rector]_

## 3.1 · Propuesta de valor

_[Propuesta de valor — frase principal]_

_[Presentación en primera persona: quién sos y qué construís]_

_[Qué hace tu trabajo y qué genera]_

---

# EXTRAS

## CAPA 1 | POSICIONAMIENTO

### Quién es

_[Descripción de posicionamiento]_

→ _[Definición corta]_
→ _[Definición corta]_

#### ROL PRINCIPAL

_[Rol principal]_

## CAPA 2 | A QUIÉN LE HABLA

### Perfil del cliente

| Quiénes son | _[Completar]_ |
| --- | --- |
| Momento vital | _[Completar]_ |

**Niveles de madurez digital**

| Inicial | _[Completar]_ |
| --- | --- |
| Medio | _[Completar]_ |
| Avanzado | _[Completar]_ |

**Para profundizar**

_[Preguntas abiertas / lo que falta definir del perfil]_

## CAPA 3 | QUÉ OFRECE

### Estructura de servicios

| **Servicio 1** | **_[Nombre]_** | _[Descripción]_ | _[Precio]_ |
| --- | --- | --- | --- |
| **Servicio 2** | **_[Nombre]_** | _[Descripción]_ | _[Precio]_ |
| **Servicio 3** | **_[Nombre]_** | _[Descripción]_ | _[Precio]_ |

_[Nota sobre mantenimiento / satélites técnicos]_

## CAPA 4 | TRANSFORMACIÓN

### Lo que cambia en el cliente

| Antes | Durante | Después |
| --- | --- | --- |
| _[Completar]_ | _[Completar]_ | _[Completar]_ |

---

Frase clave de transformación: _[Frase]_`;

export type NarrativaProjectInput = {
  title: string;
  narrativaContent?: unknown;
  client: Pick<Client, "name">;
};

export function buildDefaultNarrativaContent(project: NarrativaProjectInput): NarrativaContent {
  const header = [
    `# Narrativa de marca — ${project.client.name}`,
    ``,
    `**Proyecto:** ${project.title}`,
    ``,
    `---`,
    ``,
  ].join("\n");

  return { body: header + NARRATIVA_DEFAULT_BODY, format: "markdown" };
}

export function resolveNarrativaContent(project: NarrativaProjectInput): NarrativaContent {
  const stored = normalizeNarrativaContent(project.narrativaContent);
  if (stored.body.trim()) return stored;
  return buildDefaultNarrativaContent(project);
}
