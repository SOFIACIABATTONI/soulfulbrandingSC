import type { ContactMessage } from "@prisma/client";
import { CONTACT_FORM_LABELS, isContactFormKey } from "@/lib/contact-form-keys";

const BASE_BUDGET_TEMPLATE = `Hola {{clientFirstName}},

Gracias por tu consulta y por compartir el contexto de tu proyecto.

Te dejo este borrador inicial de presupuesto para la etapa {{stageTitle}}.

Cliente: {{clientName}}
Email: {{clientEmail}}
Formulario: {{formLabel}}

Propuesta
- Alcance:
- Entregables:
- Inversión:
- Tiempos estimados:
- Forma de pago:

Contexto compartido por el cliente
{{leadMessage}}

Próximo paso
Si estás de acuerdo con esta dirección, avanzamos con la propuesta final y la coordinación del siguiente encuentro.

Abrazo,
Sofia`;

function resolveFormLabel(formKey: string) {
  if (isContactFormKey(formKey)) return CONTACT_FORM_LABELS[formKey];
  return formKey;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

export function buildLeadBudgetDraft(lead: Pick<ContactMessage, "name" | "email" | "message" | "formKey" | "stageTitle">) {
  const stageTitle = lead.stageTitle?.trim() || "la etapa consultada";
  const replacements: Record<string, string> = {
    "{{clientFirstName}}": firstName(lead.name),
    "{{clientName}}": lead.name.trim(),
    "{{clientEmail}}": lead.email.trim(),
    "{{formLabel}}": resolveFormLabel(lead.formKey),
    "{{stageTitle}}": stageTitle,
    "{{leadMessage}}": lead.message.trim(),
  };

  return Object.entries(replacements).reduce(
    (draft, [token, value]) => draft.replaceAll(token, value || "—"),
    BASE_BUDGET_TEMPLATE,
  );
}
